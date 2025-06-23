"use client"

import React, { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftRight, IndianRupee, LayoutDashboard, PlusCircle, Settings, Sparkles, Target, Trash2 } from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';

import { getSmartAdvice } from '@/ai/flows/get-smart-advice';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { CategoryPieChart } from '@/components/category-pie-chart';
import { ThemeToggle } from '@/components/theme-toggle';
import { CATEGORIES, findCategoryEmoji } from '@/lib/constants';
import type { Category, Transaction } from '@/lib/types';
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

export default function StuSaveApp() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);

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
      <main className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary dark:text-primary">StuSave</h1>
          <p className="text-muted-foreground mt-2">Your Smart Student Money Manager</p>
        </header>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto sm:h-12">
            <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row gap-2 py-2"><LayoutDashboard />Dashboard</TabsTrigger>
            <TabsTrigger value="transactions" className="flex flex-col sm:flex-row gap-2 py-2"><ArrowLeftRight />Transactions</TabsTrigger>
            <TabsTrigger value="goals" className="flex flex-col sm:flex-row gap-2 py-2"><Target />Goals & Budget</TabsTrigger>
            <TabsTrigger value="advisor" className="flex flex-col sm:flex-row gap-2 py-2"><Sparkles />AI Advisor</TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col sm:flex-row gap-2 py-2"><Settings />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Balance</CardTitle>
                  <CardDescription>Income - Total Expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold flex items-center"><IndianRupee size={32} className="mr-1"/> {balance.toFixed(2)}</p>
                </CardContent>
              </Card>
               <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>This Month's Budget</CardTitle>
                  <CardDescription>You've spent {monthlyExpenses.toFixed(2)} so far.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className={`text-3xl font-bold flex items-center ${budgetRemaining < 0 ? 'text-destructive' : ''}`}><IndianRupee size={28} className="mr-1"/> {budgetRemaining.toFixed(2)} left</p>
                    <Progress value={budgetProgress} className="mt-4 h-3" />
                </CardContent>
              </Card>
               <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Savings Goal</CardTitle>
                  <CardDescription>{state.goal.name}</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-3xl font-bold flex items-center"><IndianRupee size={28} className="mr-1"/> {state.goal.savedAmount.toFixed(2)}</p>
                   <p className="text-sm text-muted-foreground">out of {state.goal.targetAmount.toFixed(2)}</p>
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
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>All your logged expenses.</CardDescription>
                    </div>
                    <Dialog open={isAddTransactionOpen} onOpenChange={setAddTransactionOpen}>
                      <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2"/> Add Transaction</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add a New Transaction</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={transactionForm.handleSubmit(handleAddTransaction)} className="space-y-4">
                           <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input id="amount" type="number" {...transactionForm.register("amount")} />
                            {transactionForm.formState.errors.amount && <p className="text-destructive text-sm">{transactionForm.formState.errors.amount.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" {...transactionForm.register("description")} />
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
                                            {CATEGORIES.map(c => <SelectItem key={c.name} value={c.name}>{c.emoji} {c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )} />
                            {transactionForm.formState.errors.category && <p className="text-destructive text-sm">{transactionForm.formState.errors.category.message}</p>}
                           </div>
                           <div className="space-y-2">
                             <Label htmlFor="date">Date</Label>
                             <Input id="date" type="date" {...transactionForm.register("date")} />
                             {transactionForm.formState.errors.date && <p className="text-destructive text-sm">{transactionForm.formState.errors.date.message}</p>}
                           </div>
                           <DialogFooter>
                             <DialogClose asChild>
                               <Button type="button" variant="secondary">Cancel</Button>
                             </DialogClose>
                             <Button type="submit">Save Transaction</Button>
                           </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                   <TransactionList transactions={state.transactions} onDelete={handleDeleteTransaction}/>
                </CardContent>
            </Card>
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
                                <Label htmlFor="income">Monthly Income (₹)</Label>
                                <Input id="income" type="number" {...financesForm.register("income")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="budget">Monthly Budget (₹)</Label>
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
                                <Label htmlFor="targetAmount">Target Amount (₹)</Label>
                                <Input id="targetAmount" type="number" {...goalForm.register("targetAmount")} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="savedAmount">Currently Saved (₹)</Label>
                                <Input id="savedAmount" type="number" {...goalForm.register("savedAmount")} />
                            </div>
                            <Button type="submit">Set Goal</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="advisor" className="mt-6">
            <AdvisorView />
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

function TransactionList({ transactions, onDelete }: { transactions: Transaction[], onDelete: (id: string) => void }) {
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
                    {filteredTransactions.map(t => (
                        <li key={t.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors animate-in fade-in-0 slide-in-from-top-2 duration-300">
                           <div className="flex items-center gap-4">
                               <span className="text-2xl">{findCategoryEmoji(t.category)}</span>
                               <div>
                                   <p className="font-semibold">{t.description}</p>
                                   <p className="text-sm text-muted-foreground">{format(new Date(t.date), 'MMM dd, yyyy')}</p>
                               </div>
                           </div>
                           <div className="flex items-center gap-3">
                                <p className="font-semibold text-lg">₹{t.amount.toFixed(2)}</p>
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
                    ))}
                </ul>
                {filteredTransactions.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground">No transactions for this period.</p></div>}
            </ScrollArea>
        </div>
    )
}

function AdvisorView() {
    const { state } = useStore();
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGetAdvice = async () => {
        setLoading(true);
        setAdvice('');
        try {
            const spendingSummary = state.transactions
                .slice(0, 10) // a summary of recent transactions
                .map(t => `${t.category}: ₹${t.amount}`)
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
        <Card>
            <CardHeader>
                <CardTitle>AI Money Advisor</CardTitle>
                <CardDescription>Get personalized, smart money-saving tips based on your spending habits.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <Button onClick={handleGetAdvice} disabled={loading} size="lg">
                    {loading ? "Thinking..." : <>💡 Get Smart Tip</>}
                </Button>

                {loading && (
                    <div className="mt-6 space-y-4">
                       <Skeleton className="h-8 w-3/4 mx-auto" />
                       <Skeleton className="h-8 w-1/2 mx-auto" />
                    </div>
                )}

                {advice && !loading && (
                     <Card className="mt-6 bg-primary/10 border-primary/20 text-center animate-in fade-in-0 zoom-in-95 duration-500">
                        <CardContent className="pt-6">
                            <p className="text-lg font-medium font-headline text-primary dark:text-primary-foreground">
                                {advice}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
             <CardFooter className="flex-col items-center justify-center text-xs text-muted-foreground pt-4">
                <p>Powered by Gemini AI</p>
                <p>Advice is generated and may not always be accurate.</p>
            </CardFooter>
        </Card>
    );
}
