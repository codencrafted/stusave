
"use client"

import React, { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftRight, LayoutDashboard, PlusCircle, Settings, Sparkles, Target, Trash2, HandCoins, Users, CheckCircle2, XCircle, Bell, Lightbulb, ScanLine } from 'lucide-react';
import { format, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import { getSmartAdvice } from '@/ai/flows/get-smart-advice';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { CategoryPieChart } from '@/components/category-pie-chart';
import { ThemeToggle } from '@/components/theme-toggle';
import { CATEGORIES, findCategoryEmoji, CURRENCIES, findCurrencySymbol, findCategoryIcon } from '@/lib/constants';
import type { Category, Transaction, Currency, CreditDebitRecord, LendBorrowStatus, LendBorrowType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.enum(CATEGORIES.map(c => c.name) as [Category, ...Category[]]),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
});

const financesSchema = z.object({
    income: z.coerce.number().min(0, "Income must be non-negative"),
    budget: z.coerce.number().min(0, "Budget must be non-negative"),
});

const goalSchema = z.object({
    name: z.string().min(1, "Goal name is required"),
    targetAmount: z.coerce.number().positive("Target amount must be positive"),
    savedAmount: z.coerce.number().min(0, "Saved amount must be non-negative"),
});

const lendBorrowSchema = z.object({
  type: z.enum(['credit', 'debit']),
  person: z.string().min(1, "Person's name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  purpose: z.string().min(1, "Purpose is required"),
  date: z.string().min(1, "Date is required"),
});

export default function StuSaveApp() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const currencySymbol = useMemo(() => findCurrencySymbol(state.currency), [state.currency]);

  // Forms
  const transactionForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { date: format(new Date(), 'yyyy-MM-dd'), description: '', amount: 0, category: 'Food' },
  });

  const financesForm = useForm<z.infer<typeof financesSchema>>({
    resolver: zodResolver(financesSchema),
    defaultValues: { income: state.income, budget: state.budget },
  });

  const goalForm = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: state.goal,
  });

  // Calculations
  const totalExpenses = useMemo(() => state.transactions.reduce((sum, t) => sum + t.amount, 0), [state.transactions]);
  const balance = useMemo(() => state.income - totalExpenses, [state.income, totalExpenses]);
  
  const monthlyExpenses = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = new Date();
    return state.transactions
      .filter(t => isWithinInterval(new Date(t.date), { start, end }))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);
  
  const budgetRemaining = useMemo(() => state.budget - monthlyExpenses, [state.budget, monthlyExpenses]);
  const budgetProgress = useMemo(() => (state.budget > 0 ? (monthlyExpenses / state.budget) * 100 : 0), [state.budget, monthlyExpenses]);
  const goalProgress = useMemo(() => (state.goal.targetAmount > 0 ? (state.goal.savedAmount / state.goal.targetAmount) * 100 : 0), [state.goal]);

  const { totalLent, totalBorrowed, netCreditDebit, pendingDebts } = useMemo(() => {
    const lent = state.lendBorrow
      .filter(r => r.type === 'debit' && r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);
    const borrowed = state.lendBorrow
      .filter(r => r.type === 'credit' && r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);
    const debts = state.lendBorrow.filter(r => r.type === 'credit' && r.status === 'pending');
    return { totalLent: lent, totalBorrowed: borrowed, netCreditDebit: lent - borrowed, pendingDebts: debts };
  }, [state.lendBorrow]);


  // Handlers
  const handleAddTransaction = (values: z.infer<typeof transactionSchema>) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: { ...values, id: crypto.randomUUID() } });
    toast({ title: "Success!", description: "Transaction added." });
    transactionForm.reset({ date: format(new Date(), 'yyyy-MM-dd'), description: '', amount: 0, category: 'Food' });
    setAddTransactionOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    toast({ title: "Transaction Deleted", variant: 'destructive' });
  };
  
  const handleSetFinances = (values: z.infer<typeof financesSchema>) => {
    dispatch({ type: 'SET_FINANCES', payload: values });
    toast({ title: "Success!", description: "Income and budget updated." });
  };

  const handleSetGoal = (values: z.infer<typeof goalSchema>) => {
    dispatch({ type: 'SET_GOAL', payload: values });
    toast({ title: "Success!", description: "Savings goal updated." });
  };

  const handleSetCurrency = (currencyCode: Currency) => {
    dispatch({ type: 'SET_CURRENCY', payload: currencyCode });
    toast({ title: "Success!", description: `Currency set to ${currencyCode}` });
  };
  
  const handleResetData = () => {
    dispatch({ type: 'RESET_DATA' });
    toast({ title: "Data Reset", description: "All your data has been cleared." });
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'stusave_data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 font-body">
      <main className="w-full max-w-4xl mx-auto pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto sm:h-12">
            <TabsTrigger value="dashboard" className="relative flex flex-col sm:flex-row gap-2 py-2">
              <LayoutDashboard className="z-10" />
              <span className="z-10">Dashboard</span>
              {activeTab === 'dashboard' && (
                  <motion.div layoutId="active-tab-indicator" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: "spring", stiffness: 350, damping: 30 }}/>
              )}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="relative flex flex-col sm:flex-row gap-2 py-2">
              <ArrowLeftRight className="z-10" />
              <span className="z-10">Transactions</span>
               {activeTab === 'transactions' && (
                  <motion.div layoutId="active-tab-indicator" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: "spring", stiffness: 350, damping: 30 }}/>
              )}
            </TabsTrigger>
            <TabsTrigger value="lendborrow" className="relative flex flex-col sm:flex-row gap-2 py-2">
              <HandCoins className="z-10" />
              <span className="z-10">Lend/Borrow</span>
               {activeTab === 'lendborrow' && (
                  <motion.div layoutId="active-tab-indicator" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: "spring", stiffness: 350, damping: 30 }}/>
              )}
            </TabsTrigger>
            <TabsTrigger value="goals" className="relative flex flex-col sm:flex-row gap-2 py-2">
              <Target className="z-10" />
              <span className="z-10">Goals & Budget</span>
               {activeTab === 'goals' && (
                  <motion.div layoutId="active-tab-indicator" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: "spring", stiffness: 350, damping: 30 }}/>
              )}
            </TabsTrigger>
            <TabsTrigger value="advisor" className="relative flex flex-col sm:flex-row gap-2 py-2">
              <Sparkles className="z-10" />
              <span className="z-10">AI Advisor</span>
               {activeTab === 'advisor' && (
                  <motion.div layoutId="active-tab-indicator" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: "spring", stiffness: 350, damping: 30 }}/>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="relative flex flex-col sm:flex-row gap-2 py-2">
              <Settings className="z-10" />
              <span className="z-10">Settings</span>
               {activeTab === 'settings' && (
                  <motion.div layoutId="active-tab-indicator" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: "spring", stiffness: 350, damping: 30 }}/>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               {pendingDebts.length > 0 && (
                <Card className="md:col-span-2 lg:col-span-3 bg-destructive/10 border-destructive/20">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Bell className="text-destructive" />
                    <div>
                      <CardTitle className="text-destructive">Pending Repayments</CardTitle>
                      <CardDescription className="text-destructive/80">You have outstanding debts to settle.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {pendingDebts.map(debt => (
                        <li key={debt.id}>You still owe <span className="font-bold">{currencySymbol}{debt.amount.toFixed(2)}</span> to <span className="font-bold">{debt.person}</span>.</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Balance</CardTitle>
                  <CardDescription>Income - Total Expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold flex items-center"><span className="mr-2 text-3xl">{currencySymbol}</span>{balance.toFixed(2)}</p>
                </CardContent>
              </Card>
               <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>This Month's Budget</CardTitle>
                  <CardDescription>You've spent {currencySymbol}{monthlyExpenses.toFixed(2)} so far.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className={`text-3xl font-bold flex items-center ${budgetRemaining < 0 ? 'text-destructive' : ''}`}><span className="mr-2 text-2xl">{currencySymbol}</span>{budgetRemaining.toFixed(2)} left</p>
                    <Progress value={budgetProgress} className="mt-4 h-3" />
                </CardContent>
              </Card>
               <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Savings Goal</CardTitle>
                  <CardDescription>{state.goal.name}</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-3xl font-bold flex items-center"><span className="mr-2 text-2xl">{currencySymbol}</span>{state.goal.savedAmount.toFixed(2)}</p>
                   <p className="text-sm text-muted-foreground">out of {currencySymbol}{state.goal.targetAmount.toFixed(2)}</p>
                   <Progress value={goalProgress} className="mt-2 h-3" />
                </CardContent>
              </Card>
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Spending Breakdown</CardTitle>
                  <CardDescription>How you're spending your money this month.</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryPieChart transactions={state.transactions.filter(t => isWithinInterval(new Date(t.date), { start: startOfMonth(new Date()), end: new Date() }))} />
                </CardContent>
              </Card>
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Lend & Borrow Summary</CardTitle>
                  <CardDescription>Your current pending balances with friends.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">You Lent (Pending)</p>
                        <p className="text-2xl font-bold text-green-600">{currencySymbol}{totalLent.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">You Borrowed (Pending)</p>
                        <p className="text-2xl font-bold text-red-600">{currencySymbol}{totalBorrowed.toFixed(2)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Net Balance</p>
                        <p className={`text-2xl font-bold ${netCreditDebit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currencySymbol}{Math.abs(netCreditDebit).toFixed(2)}</p>
                    </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>All your logged expenses.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline"><ScanLine className="mr-2 h-4 w-4"/> Scan Spend</Button>
                      <Dialog open={isAddTransactionOpen} onOpenChange={setAddTransactionOpen}>
                        <DialogTrigger asChild>
                          <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Transaction</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add a New Transaction</DialogTitle>
                             <DialogDescription>
                              Enter the details for your new expense record.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={transactionForm.handleSubmit(handleAddTransaction)} className="space-y-4 pt-2">
                             <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                <Label htmlFor="amount">Amount ({currencySymbol})</Label>
                                <Input id="amount" type="number" placeholder="0.00" {...transactionForm.register("amount")} />
                                {transactionForm.formState.errors.amount && <p className="text-destructive text-sm">{transactionForm.formState.errors.amount.message}</p>}
                              </div>
                              <div className="space-y-2">
                                 <Label htmlFor="date">Date</Label>
                                 <Input id="date" type="date" {...transactionForm.register("date")} />
                                 {transactionForm.formState.errors.date && <p className="text-destructive text-sm">{transactionForm.formState.errors.date.message}</p>}
                               </div>
                             </div>
                             <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Input id="description" placeholder="e.g. Lunch with colleagues" {...transactionForm.register("description")} />
                              {transactionForm.formState.errors.description && <p className="text-destructive text-sm">{transactionForm.formState.errors.description.message}</p>}
                            </div>
                             <div className="space-y-2">
                              <Label htmlFor="category">Category</Label>
                              <Controller
                                  control={transactionForm.control}
                                  name="category"
                                  render={({ field }) => (
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                          <SelectContent>
                                              {CATEGORIES.map(c => {
                                                const Icon = c.icon;
                                                return (
                                                  <SelectItem key={c.name} value={c.name}>
                                                    <div className="flex items-center gap-3">
                                                      <Icon className="h-4 w-4 text-muted-foreground" />
                                                      <span>{c.name}</span>
                                                    </div>
                                                  </SelectItem>
                                                )
                                              })}
                                          </SelectContent>
                                      </Select>
                                  )} />
                              {transactionForm.formState.errors.category && <p className="text-destructive text-sm">{transactionForm.formState.errors.category.message}</p>}
                             </div>
                             <DialogFooter className="pt-4">
                               <DialogClose asChild>
                                 <Button type="button" variant="outline">Cancel</Button>
                               </DialogClose>
                               <Button type="submit">Save Transaction</Button>
                             </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                   <TransactionList transactions={state.transactions} onDelete={handleDeleteTransaction} currencySymbol={currencySymbol}/>
                </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="lendborrow" className="mt-6">
            <LendBorrowView currencySymbol={currencySymbol} />
          </TabsContent>

          <TabsContent value="goals" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Finances</CardTitle>
                        <CardDescription>Set your monthly income and budget.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={financesForm.handleSubmit(handleSetFinances)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="income">Monthly Income ({currencySymbol})</Label>
                                <Input id="income" type="number" {...financesForm.register("income")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="budget">Monthly Budget ({currencySymbol})</Label>
                                <Input id="budget" type="number" {...financesForm.register("budget")} />
                            </div>
                            <Button type="submit">Save Finances</Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Savings Goal</CardTitle>
                        <CardDescription>Define your current savings goal.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={goalForm.handleSubmit(handleSetGoal)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="goalName">Goal Name</Label>
                                <Input id="goalName" {...goalForm.register("name")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetAmount">Target Amount ({currencySymbol})</Label>
                                <Input id="targetAmount" type="number" {...goalForm.register("targetAmount")} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="savedAmount">Currently Saved ({currencySymbol})</Label>
                                <Input id="savedAmount" type="number" {...goalForm.register("savedAmount")} />
                            </div>
                            <Button type="submit">Set Goal</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="advisor" className="mt-6">
            <AdvisorView currencySymbol={currencySymbol} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your app settings and data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                            <Label>Appearance</Label>
                            <p className="text-sm text-muted-foreground">Toggle between light and dark mode.</p>
                        </div>
                        <ThemeToggle />
                    </div>
                     <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                            <Label>Currency</Label>
                            <p className="text-sm text-muted-foreground">Choose your preferred currency.</p>
                        </div>
                        <Select value={state.currency} onValueChange={(value) => handleSetCurrency(value as Currency)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                            <Label>Export Data</Label>
                            <p className="text-sm text-muted-foreground">Download your data as a JSON file.</p>
                        </div>
                        <Button variant="outline" onClick={handleExportData}>Export</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50">
                        <div>
                            <Label className="text-destructive">Reset Data</Label>
                            <p className="text-sm text-destructive/80">Permanently delete all your data.</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Reset</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete all your transactions, budget, and goals.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleResetData}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function TransactionList({ transactions, onDelete, currencySymbol }: { transactions: Transaction[], onDelete: (id: string) => void, currencySymbol: string }) {
    const [filter, setFilter] = useState('month');

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        if (filter === 'today') {
            return transactions.filter(t => format(new Date(t.date), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'));
        }
        if (filter === 'week') {
            const start = startOfWeek(now);
            const end = now;
            return transactions.filter(t => isWithinInterval(new Date(t.date), { start, end }));
        }
        // month
        const start = startOfMonth(now);
        const end = now;
        return transactions.filter(t => isWithinInterval(new Date(t.date), { start, end }));
    }, [filter, transactions]);

    if (transactions.length === 0) {
        return <div className="text-center py-12"><p className="text-muted-foreground">No transactions yet. Add one to get started!</p></div>
    }

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <ScrollArea className="h-[400px]">
                <ul className="space-y-3 pr-4">
                    {filteredTransactions.map(t => {
                        const Icon = findCategoryIcon(t.category);
                        return (
                            <li key={t.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors animate-in fade-in-0 slide-in-from-top-2 duration-300">
                               <div className="flex items-center gap-4">
                                   <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                       <Icon className="h-5 w-5 text-primary" />
                                   </div>
                                   <div>
                                       <p className="font-semibold">{t.description}</p>
                                       <p className="text-sm text-muted-foreground">{format(new Date(t.date), 'MMM dd, yyyy')}</p>
                                   </div>
                               </div>
                               <div className="flex items-center gap-3">
                                    <p className="font-semibold text-lg">{currencySymbol}{t.amount.toFixed(2)}</p>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive size-8">
                                                <Trash2 size={16}/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                                                <AlertDialogDescription>Are you sure you want to delete this transaction? This cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDelete(t.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                               </div>
                            </li>
                        );
                    })}
                </ul>
                {filteredTransactions.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground">No transactions for this period.</p></div>}
            </ScrollArea>
        </div>
    )
}

function LendBorrowView({ currencySymbol }: { currencySymbol: string }) {
    const { state, dispatch } = useStore();
    const { toast } = useToast();
    const [isAddLendBorrowOpen, setAddLendBorrowOpen] = useState(false);

    const form = useForm<z.infer<typeof lendBorrowSchema>>({
        resolver: zodResolver(lendBorrowSchema),
        defaultValues: {
            date: format(new Date(), 'yyyy-MM-dd'),
            person: '',
            purpose: '',
            amount: 0,
            type: 'debit',
        },
    });

    const handleAddRecord = (values: z.infer<typeof lendBorrowSchema>) => {
        dispatch({
            type: 'ADD_LEND_BORROW',
            payload: { ...values, id: crypto.randomUUID(), status: 'pending' },
        });
        toast({ title: "Success!", description: "Record added." });
        form.reset({
            date: format(new Date(), 'yyyy-MM-dd'),
            person: '',
            purpose: '',
            amount: 0,
            type: 'debit',
        });
        setAddLendBorrowOpen(false);
    };

    const handleToggleStatus = (id: string, currentStatus: LendBorrowStatus) => {
        const newStatus = currentStatus === 'pending' ? 'paid' : 'pending';
        dispatch({ type: 'UPDATE_LEND_BORROW_STATUS', payload: { id, status: newStatus } });
        toast({ title: `Record marked as ${newStatus}.` });
    };

    const handleDeleteRecord = (id: string) => {
        dispatch({ type: 'DELETE_LEND_BORROW', payload: id });
        toast({ title: "Record Deleted", variant: 'destructive' });
    }

    const { lent, borrowed } = useMemo(() => {
        return {
            lent: state.lendBorrow.filter(r => r.type === 'debit'),
            borrowed: state.lendBorrow.filter(r => r.type === 'credit'),
        };
    }, [state.lendBorrow]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Lend & Borrow Tracker</CardTitle>
                    <CardDescription>Manage money shared with your friends.</CardDescription>
                </div>
                <Dialog open={isAddLendBorrowOpen} onOpenChange={setAddLendBorrowOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2"/> Add Record</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add a New Lend/Borrow Record</DialogTitle></DialogHeader>
                        <form onSubmit={form.handleSubmit(handleAddRecord)} className="space-y-4">
                            <Controller
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                        <div>
                                            <RadioGroupItem value="debit" id="debit" className="peer sr-only" />
                                            <Label htmlFor="debit" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                I Lent Money
                                            </Label>
                                        </div>
                                        <div>
                                            <RadioGroupItem value="credit" id="credit" className="peer sr-only" />
                                            <Label htmlFor="credit" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-destructive [&:has([data-state=checked])]:border-destructive">
                                                I Borrowed Money
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                            <div className="space-y-2">
                                <Label htmlFor="person">Person's Name</Label>
                                <Input id="person" {...form.register("person")} />
                                {form.formState.errors.person && <p className="text-destructive text-sm">{form.formState.errors.person.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount ({currencySymbol})</Label>
                                <Input id="amount" type="number" {...form.register("amount")} />
                                {form.formState.errors.amount && <p className="text-destructive text-sm">{form.formState.errors.amount.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="purpose">Purpose</Label>
                                <Input id="purpose" {...form.register("purpose")} />
                                {form.formState.errors.purpose && <p className="text-destructive text-sm">{form.formState.errors.purpose.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" {...form.register("date")} />
                                {form.formState.errors.date && <p className="text-destructive text-sm">{form.formState.errors.date.message}</p>}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                <Button type="submit">Save Record</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="lent">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="lent">Money I Lent</TabsTrigger>
                        <TabsTrigger value="borrowed">Money I Borrowed</TabsTrigger>
                    </TabsList>
                    <TabsContent value="lent" className="mt-4">
                        <RecordList records={lent} type="debit" currencySymbol={currencySymbol} onToggleStatus={handleToggleStatus} onDelete={handleDeleteRecord} />
                    </TabsContent>
                    <TabsContent value="borrowed" className="mt-4">
                        <RecordList records={borrowed} type="credit" currencySymbol={currencySymbol} onToggleStatus={handleToggleStatus} onDelete={handleDeleteRecord} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

function RecordList({ records, type, currencySymbol, onToggleStatus, onDelete }: { records: CreditDebitRecord[], type: LendBorrowType, currencySymbol: string, onToggleStatus: (id: string, status: LendBorrowStatus) => void, onDelete: (id: string) => void }) {
    if (records.length === 0) {
        return <div className="text-center py-12"><p className="text-muted-foreground">No records here. Add one to get started!</p></div>
    }

    const cardColor = type === 'debit' ? "bg-primary/10 border-primary/20" : "bg-destructive/10 border-destructive/20";
    const statusButtonColor = type === 'debit' ? "outline" : "destructive";

    return (
        <ScrollArea className="h-[400px]">
            <ul className="space-y-3 pr-4">
                <AnimatePresence>
                    {records.map(record => (
                        <motion.li
                            key={record.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                            className={`p-4 rounded-lg border ${cardColor} ${record.status === 'paid' ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                       <Users size={24} />
                                       <p className="font-bold text-lg">{record.person}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-xl">{currencySymbol}{record.amount.toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">{record.purpose}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(record.date), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                     <div className="flex items-center gap-2">
                                        <Button 
                                          variant={record.status === 'pending' ? statusButtonColor : 'secondary'}
                                          size="sm"
                                          onClick={() => onToggleStatus(record.id, record.status)}
                                        >
                                            {record.status === 'pending' ? <XCircle size={16} className="mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                                            {record.status === 'pending' ? "Mark as Paid" : "Mark as Pending"}
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive size-8">
                                                    <Trash2 size={16}/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                                                    <AlertDialogDescription>Are you sure you want to delete this record? This cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDelete(record.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${record.status === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
                                        {record.status.toUpperCase()}
                                    </span>
                               </div>
                            </div>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>
        </ScrollArea>
    )
}


function AdvisorView({ currencySymbol }: { currencySymbol: string }) {
    const { state } = useStore();
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGetAdvice = async () => {
        setLoading(true);
        setAdvice('');
        try {
            const spendingSummary = state.transactions
                .slice(0, 10) // a summary of recent transactions
                .map(t => `${t.category}: ${currencySymbol}${t.amount}`)
                .join(', ');
            
            if (!spendingSummary) {
                setAdvice("You haven't logged any spending yet. Add some transactions to get personalized advice!");
                setLoading(false);
                return;
            }

            const result = await getSmartAdvice({
                spendingSummary: `Recent spending: ${spendingSummary}. Total spent this month: ${state.transactions.reduce((s,t) => s+t.amount,0)}`,
                budget: state.budget,
            });
            setAdvice(result.advice);
        } catch (error) {
            console.error("AI Error:", error);
            setAdvice("Sorry, I couldn't get any advice right now. Please try again later.");
        }
        setLoading(false);
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                       <Sparkles size={24} />
                    </div>
                    <div>
                        <CardTitle className="font-headline">AI Money Advisor</CardTitle>
                        <CardDescription>Get smart money-saving tips based on your spending.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 text-center">
                 <div className="flex flex-col items-center justify-center min-h-[250px]">
                    {loading && (
                        <div className="space-y-4 animate-in fade-in-0">
                           <p className="text-muted-foreground">Generating your smart tip...</p>
                           <Skeleton className="h-8 w-64 mx-auto" />
                           <Skeleton className="h-8 w-48 mx-auto" />
                        </div>
                    )}

                    {!loading && advice && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="bg-primary/10 border-l-4 border-primary p-6 rounded-lg text-left w-full"
                        >
                            <p className="text-xl font-medium font-headline text-primary-foreground/90">
                                {advice}
                            </p>
                        </motion.div>
                    )}

                    {!loading && !advice && (
                        <div className="text-center space-y-3 animate-in fade-in-0">
                            <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">Ready for some advice?</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Click the button below to let our AI analyze your spending and give you a personalized money-saving tip.
                            </p>
                        </div>
                    )}
                </div>

            </CardContent>
            <CardFooter className="flex-col items-center justify-center border-t pt-6">
                <Button onClick={handleGetAdvice} disabled={loading} size="lg">
                    {loading ? "Thinking..." : "💡 Get Smart Tip"}
                </Button>
                <div className="text-xs text-muted-foreground mt-4 text-center">
                    <p>Powered by Gemini AI.</p>
                    <p>Advice is generated and may not always be accurate.</p>
                </div>
            </CardFooter>
        </Card>
    );
}
