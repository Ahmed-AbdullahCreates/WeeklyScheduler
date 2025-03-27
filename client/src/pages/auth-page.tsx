import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  School, 
  Check, 
  AlertCircle, 
  LockKeyhole
} from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  isAdmin: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordChecks, setPasswordChecks] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecial: false
  });

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      isAdmin: false,
    },
  });

  // Monitor password input to provide strength feedback
  useEffect(() => {
    const subscription = registerForm.watch((value, { name }) => {
      if (name === "password" || name === undefined) {
        const password = value.password as string || "";
        
        // Check password criteria
        const checks = {
          hasMinLength: password.length >= 8,
          hasUpperCase: /[A-Z]/.test(password),
          hasLowerCase: /[a-z]/.test(password),
          hasNumber: /[0-9]/.test(password),
          hasSpecial: /[^A-Za-z0-9]/.test(password)
        };
        
        setPasswordChecks(checks);
        
        // Calculate strength
        const metCriteria = Object.values(checks).filter(Boolean).length;
        let strength = 0;
        
        if (password.length > 0) {
          strength = Math.min(100, metCriteria * 20);
        }
        
        setPasswordStrength(strength);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [registerForm.watch]);

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 20) return "Very Weak";
    if (passwordStrength <= 40) return "Weak";
    if (passwordStrength <= 60) return "Fair";
    if (passwordStrength <= 80) return "Good";
    return "Strong";
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 20) return "bg-red-500";
    if (passwordStrength <= 40) return "bg-orange-500";
    if (passwordStrength <= 60) return "bg-yellow-500";
    if (passwordStrength <= 80) return "bg-lime-500";
    return "bg-green-500";
  };

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  // Redirect to dashboard if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex justify-center">
            <School className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-center text-neutral-900">Weekly Planner System</h2>
          <p className="mt-2 text-sm text-center text-neutral-600">
            Manage your school's weekly lesson plans efficiently
          </p>

          <div className="mt-8">
            <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {loginMutation.error && (
                          <Alert className="border-red-500 bg-red-50 text-red-800 my-3">
                            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                            <AlertDescription>
                              {loginMutation.error.message || "Invalid username or password"}
                            </AlertDescription>
                          </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                          {loginMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <LockKeyhole className="h-4 w-4 mr-2" />
                          )}
                          Login
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <p className="text-sm text-neutral-500">
                      Don't have an account?{" "}
                      <Button variant="link" className="p-0" onClick={() => setActiveTab("register")}>
                        Register
                      </Button>
                    </p>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Register</CardTitle>
                    <CardDescription>
                      Create a new account to use the Weekly Planner System
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Full Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Password" {...field} />
                              </FormControl>
                              <FormMessage />
                              {field.value && (
                                <div className="mt-2 space-y-2">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span>Strength: {getPasswordStrengthText()}</span>
                                      <span className={passwordStrength >= 80 ? "text-green-600 font-medium" : ""}>
                                        {passwordStrength}%
                                      </span>
                                    </div>
                                    <Progress value={passwordStrength} className={getPasswordStrengthColor()} />
                                  </div>
                                  
                                  <div className="text-xs space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      {passwordChecks.hasMinLength ? (
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                      ) : (
                                        <AlertCircle className="h-3.5 w-3.5 text-neutral-400" />
                                      )}
                                      <span className={passwordChecks.hasMinLength ? "text-green-600" : "text-neutral-600"}>
                                        At least 8 characters
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {passwordChecks.hasUpperCase ? (
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                      ) : (
                                        <AlertCircle className="h-3.5 w-3.5 text-neutral-400" />
                                      )}
                                      <span className={passwordChecks.hasUpperCase ? "text-green-600" : "text-neutral-600"}>
                                        Contains uppercase letters
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {passwordChecks.hasLowerCase ? (
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                      ) : (
                                        <AlertCircle className="h-3.5 w-3.5 text-neutral-400" />
                                      )}
                                      <span className={passwordChecks.hasLowerCase ? "text-green-600" : "text-neutral-600"}>
                                        Contains lowercase letters
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {passwordChecks.hasNumber ? (
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                      ) : (
                                        <AlertCircle className="h-3.5 w-3.5 text-neutral-400" />
                                      )}
                                      <span className={passwordChecks.hasNumber ? "text-green-600" : "text-neutral-600"}>
                                        Contains numbers
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {passwordChecks.hasSpecial ? (
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                      ) : (
                                        <AlertCircle className="h-3.5 w-3.5 text-neutral-400" />
                                      )}
                                      <span className={passwordChecks.hasSpecial ? "text-green-600" : "text-neutral-600"}>
                                        Contains special characters
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </FormItem>
                          )}
                        />
                        {registerMutation.error && (
                          <Alert className="border-red-500 bg-red-50 text-red-800 my-3">
                            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                            <AlertDescription>
                              {registerMutation.error.message || "Registration failed. Please try again."}
                            </AlertDescription>
                          </Alert>
                        )}
                        <Button 
                          type="submit" 
                          className="w-full mt-2" 
                          disabled={registerMutation.isPending || (passwordStrength > 0 && passwordStrength < 60)}
                          variant={passwordStrength >= 80 ? "default" : "outline"}
                        >
                          {registerMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Register
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <p className="text-sm text-neutral-500">
                      Already have an account?{" "}
                      <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>
                        Login
                      </Button>
                    </p>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-primary to-primary-dark flex items-center justify-center">
          <div className="max-w-2xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">School Weekly Planner System</h1>
            <p className="text-xl mb-6">An efficient way to manage and track your school's weekly lesson plans.</p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Streamlined Planning Process</h3>
                  <p className="mt-1">Create and manage weekly plans for all subjects in your assigned grades.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Flexible Administration</h3>
                  <p className="mt-1">Administrators can assign teachers to grades and subjects with ease.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Comprehensive Planning</h3>
                  <p className="mt-1">Track topics, homework, assignments, and more for each day of the week.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
