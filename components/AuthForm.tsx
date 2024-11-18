"use client";

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { createAccount, signInUser } from '@/lib/actions/user.actions';
import OTPModal from './OTPModal';

type FormType = 'sign-in' | 'sign-up';

const authFormSchema = (formType: FormType) => {
  return z.object({
    email: z.string().email(),
    fullName: formType === 'sign-up' ? z.string().min(2).max(50) : z.string().optional(),
  })
}

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [accountId, setAccountId] = useState(null);

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      fullName: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const user = type === 'sign-up' 
        ? await createAccount({
            email: data.email,
            fullName: data.fullName || '',
          }) 
        : await signInUser({ email: data.email });

      setAccountId(user.accountId);
    } catch (error) {
      setErrorMessage("Failed to create account, please try again");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='auth-form'>
          <h1 className='form-title'>
            {type === 'sign-in' ? 'Sign In' : 'Sign Up'}
          </h1>
          {type === 'sign-up' && (
            <FormField
              control={form.control}
              name='fullName'
              render={({ field }) => (
                <FormItem>
                  <div className='shad-form-item'>
                    <FormLabel className='shad-form-label'>Full Name</FormLabel>

                    <FormControl>
                      <Input placeholder='John Doe' className='shad-input' {...field} />
                    </FormControl>
                  </div>
                  <FormMessage className='shad-form-message' />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <div className='shad-form-item'>
                  <FormLabel className='shad-form-label'>Email</FormLabel>

                  <FormControl>
                    <Input placeholder='youremail@example.com' className='shad-input' {...field} />
                  </FormControl>
                </div>
                <FormMessage className='shad-form-message' />
              </FormItem>
            )}
          />

          <Button type='submit' className='form-submit-button' disabled={isLoading}>
            {type === 'sign-in' ? 'Sign In' : 'Sign Up'}

            {isLoading && (
              <Image
                src="/assets/icons/loader.svg"
                alt="Loading..."
                width={24}
                height={24}
                className="ml-2 animate-spin"
              />
            )}
          </Button>

          {errorMessage && <p className='error-message'>*{errorMessage}</p>}

          <div className='body-2 flex justify-center'>
            <p className='text-light-100'>
              {type === 'sign-in'
                ? "Don't have an account? "
                : 'Already have an account? '}
            </p>
            <Link href={type === 'sign-in' ? '/sign-up' : '/sign-in'} className='ml-1 font-medium text-brand'>
              {type === 'sign-in' ? 'Sign Up' : 'Sign In'}
            </Link>
          </div>
        </form>
      </Form>
      
      {accountId && <OTPModal email={form.getValues('email')} accountId={accountId} />}
    </>
  )
}

export default AuthForm