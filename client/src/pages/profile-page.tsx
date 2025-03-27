import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Loader2, 
  Check, 
  AlertCircle, 
  KeyIcon, 
  LockKeyhole,
  UserIcon
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

// Schema for profile update
const profileSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
});

// Schema for password change
const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    number: false,
    special: false,
    uppercase: false,
  });
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Check password strength with useCallback to avoid dependency cycles
  const checkPasswordStrength = useCallback((password: string) => {
    let strength = 0;
    const criteria = {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      uppercase: /[A-Z]/.test(password),
    };

    // Calculate score
    if (criteria.length) strength += 25;
    if (criteria.number) strength += 25;
    if (criteria.special) strength += 25;
    if (criteria.uppercase) strength += 25;

    setPasswordStrength(strength);
    setPasswordCriteria(criteria);
  }, [setPasswordStrength, setPasswordCriteria]);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
    }
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    }
  });
  
  // Listen for password changes to update strength indicator
  useEffect(() => {
    const subscription = passwordForm.watch((value) => {
      // Check if password exists and update strength
      if (value.password) {
        checkPasswordStrength(value.password);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [passwordForm, checkPasswordStrength]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user!.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${user!.id}`, {
        password: data.password
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate({ password: data.password });
  };

  // If no user is available, this should not happen due to protected route
  if (!user) {
    return <div>Unauthorized</div>;
  }

  return (
    <PageWrapper title="Profile">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="shadow-md border-0 md:col-span-2 md:row-span-2 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-indigo-100/30 border-b">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/90 to-indigo-600 text-white text-xl font-semibold shadow-lg">
                {user.fullName ? getInitials(user.fullName) : "U"}
              </div>
              <div>
                <CardTitle className="text-2xl">{user.fullName}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  @{user.username}
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary inline-block">
                    {user.isAdmin ? "Administrator" : "Teacher"}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Account Information</h3>
                <div className="grid gap-3 text-sm">
                  <div className="grid grid-cols-3 gap-4 items-center p-3 rounded-lg bg-slate-50">
                    <div className="font-medium text-gray-700">Username</div>
                    <div className="col-span-2 text-gray-600">{user.username}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-center p-3 rounded-lg bg-slate-50">
                    <div className="font-medium text-gray-700">Role</div>
                    <div className="col-span-2 text-gray-600">
                      {user.isAdmin ? "Administrator" : "Teacher"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="space-y-1 bg-gradient-to-r from-primary/5 to-indigo-100/30 border-b">
            <CardTitle className="text-xl">Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" className="border-slate-300" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90"
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="space-y-1 bg-gradient-to-r from-primary/5 to-indigo-100/30 border-b">
            <CardTitle className="text-xl">Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" className="border-slate-300" {...field} />
                      </FormControl>
                      
                      {/* Password strength indicator */}
                      {field.value && (
                        <>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Progress value={passwordStrength} className="h-2" />
                              <span className="text-xs font-medium">
                                {passwordStrength === 0 && "Very Weak"}
                                {passwordStrength > 0 && passwordStrength <= 25 && "Weak"}
                                {passwordStrength > 25 && passwordStrength <= 50 && "Fair"}
                                {passwordStrength > 50 && passwordStrength <= 75 && "Good"}
                                {passwordStrength > 75 && "Strong"}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                {passwordCriteria.length ? 
                                  <Check className="h-3 w-3 text-green-500" /> : 
                                  <AlertCircle className="h-3 w-3 text-amber-500" />
                                }
                                <span>At least 8 characters</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {passwordCriteria.uppercase ? 
                                  <Check className="h-3 w-3 text-green-500" /> : 
                                  <AlertCircle className="h-3 w-3 text-amber-500" />
                                }
                                <span>Uppercase letter</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {passwordCriteria.number ? 
                                  <Check className="h-3 w-3 text-green-500" /> : 
                                  <AlertCircle className="h-3 w-3 text-amber-500" />
                                }
                                <span>Number</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {passwordCriteria.special ? 
                                  <Check className="h-3 w-3 text-green-500" /> : 
                                  <AlertCircle className="h-3 w-3 text-amber-500" />
                                }
                                <span>Special character</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" className="border-slate-300" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2">
                  <Button 
                    type="submit" 
                    disabled={updatePasswordMutation.isPending}
                    className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90"
                  >
                    {updatePasswordMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Password
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}