import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";

import { useUpsertMyProfile, getGetMyProfileQueryKey, ProfileInputUserRole } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  userRole: z.enum(["student", "alumni", "recruiter"]),
  displayName: z.string().min(2, "Name must be at least 2 characters."),
  university: z.string().min(2, "University is required.").optional().or(z.literal("")),
  department: z.string().optional(),
  graduationYear: z.coerce.number().min(1900).max(2100).optional().or(z.literal("").transform(() => undefined)),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileOnboarding() {
  const [open, setOpen] = useState(true);
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const upsertProfile = useUpsertMyProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      userRole: "student",
      displayName: user?.fullName || "",
      university: "",
      department: "",
      graduationYear: new Date().getFullYear(),
    },
  });

  const userRole = form.watch("userRole");
  const isRecruiter = userRole === "recruiter";

  const onSubmit = (data: ProfileFormValues) => {
    upsertProfile.mutate(
      {
        data: {
          userRole: data.userRole as ProfileInputUserRole,
          displayName: data.displayName,
          university: data.university,
          department: data.department,
          graduationYear: data.graduationYear,
          avatarUrl: user?.imageUrl,
        },
      },
      {
        onSuccess: (profile) => {
          toast({
            title: "Profile created",
            description: "Welcome to AlumniConnect!",
          });
          queryClient.setQueryData(getGetMyProfileQueryKey(), profile);
          setOpen(false);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save profile. Please try again.",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" hideClose>
        <DialogHeader>
          <DialogTitle>Complete your profile</DialogTitle>
          <DialogDescription>
            Tell us a bit about yourself to join the network.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="userRole"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>I am joining as a...</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="student" id="student" className="peer sr-only" />
                        <label
                          htmlFor="student"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center"
                        >
                          <span className="text-sm font-medium">Student</span>
                        </label>
                      </div>
                      <div>
                        <RadioGroupItem value="alumni" id="alumni" className="peer sr-only" />
                        <label
                          htmlFor="alumni"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center"
                        >
                          <span className="text-sm font-medium">Alumni</span>
                        </label>
                      </div>
                      <div>
                        <RadioGroupItem value="recruiter" id="recruiter" className="peer sr-only" />
                        <label
                          htmlFor="recruiter"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center"
                        >
                          <span className="text-sm font-medium">Recruiter</span>
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isRecruiter && (
                <>
                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University</FormLabel>
                        <FormControl>
                          <Input placeholder="State University" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Major / Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Computer Science" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="graduationYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Of</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 50 }).map((_, i) => {
                                const year = new Date().getFullYear() + 5 - i;
                                return (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={upsertProfile.isPending}>
              {upsertProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Profile
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}