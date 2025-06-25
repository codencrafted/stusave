'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

import { useStore } from '@/hooks/use-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StuSaveLogo } from '@/components/logo';
import { ArrowRight, Wallet } from 'lucide-react';

const nameSchema = z.object({
  name: z.string().min(2, "Please enter a name with at least 2 characters."),
});

const financesSchema = z.object({
  income: z.coerce.number().min(0, "Income must be a positive number."),
  budget: z.coerce.number().min(0, "Budget must be a positive number."),
});

type Step = 'name' | 'finances';

export function WelcomeSetup() {
  const { dispatch } = useStore();
  const [step, setStep] = useState<Step>('name');
  const [formData, setFormData] = useState({ name: '' });

  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
  });

  const financesForm = useForm<z.infer<typeof financesSchema>>({
    resolver: zodResolver(financesSchema),
  });

  const handleNameSubmit = (values: z.infer<typeof nameSchema>) => {
    setFormData(values);
    setStep('finances');
  };

  const handleFinancesSubmit = (values: z.infer<typeof financesSchema>) => {
    dispatch({
      type: 'COMPLETE_SETUP',
      payload: {
        name: formData.name,
        income: values.income,
        budget: values.budget,
      },
    });
  };

  const variants = {
    hidden: { opacity: 0, x: 200 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -200 },
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4 font-body">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <StuSaveLogo />
          </div>
          <CardTitle className="text-2xl font-headline">Welcome to StuSave!</CardTitle>
          <CardDescription>A few quick questions to get you set up.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-hidden pt-2">
          <AnimatePresence mode="wait">
            {step === 'name' && (
              <motion.div
                key="name"
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <form onSubmit={nameForm.handleSubmit(handleNameSubmit)} className="space-y-6">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="name">First, what should we call you?</Label>
                    <Input id="name" placeholder="e.g. Alex" {...nameForm.register('name')} />
                    {nameForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{nameForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    Continue <ArrowRight />
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'finances' && (
              <motion.div
                key="finances"
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <form onSubmit={financesForm.handleSubmit(handleFinancesSubmit)} className="space-y-6 text-left">
                  <div className="space-y-2">
                    <Label htmlFor="income">What's your monthly income or pocket money?</Label>
                    <Input id="income" type="number" step="any" placeholder="e.g. 5000" {...financesForm.register('income')} />
                    {financesForm.formState.errors.income && (
                      <p className="text-sm text-destructive">{financesForm.formState.errors.income.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">What's your monthly spending budget?</Label>
                    <Input id="budget" type="number" step="any" placeholder="e.g. 3000" {...financesForm.register('budget')} />
                    {financesForm.formState.errors.budget && (
                      <p className="text-sm text-destructive">{financesForm.formState.errors.budget.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    Finish Setup <Wallet />
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
