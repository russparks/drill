import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, InsertUser } from "@shared/schema";
import ConfirmDialog from "@/components/confirm-dialog";

export default function People() {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'user', id: number, name: string } | null>(null);
  const { toast } = useToast();

  // Listen for modal open events from navbar
  useEffect(() => {
    const handleOpenPersonModal = () => {
      setSelectedUser(null);
      setIsUserDialogOpen(true);
    };

    window.addEventListener('openPersonModal', handleOpenPersonModal);
    
    return () => {
      window.removeEventListener('openPersonModal', handleOpenPersonModal);
    };
  }, []);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: (data: InsertUser) => apiRequest("POST", `/api/users`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Success",
        description: "Person created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create person.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertUser> }) => 
      apiRequest("PATCH", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Success",
        description: "Person updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update person.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "Person deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete person.",
        variant: "destructive",
      });
    },
  });

  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;
    
    const userData: InsertUser = {
      name: `${data.firstName} ${data.surname}`.trim(),
      username: data.username,
      email: data.email,
      password: data.password || "password123",
      discipline: data.discipline || null,
    };

    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data: userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const handleConfirmDelete = () => {
    if (itemToDelete && itemToDelete.type === 'user') {
      deleteUserMutation.mutate(itemToDelete.id);
      setItemToDelete(null);
      setIsConfirmDialogOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedUser ? "Edit Person" : "Add New Person"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUserSubmit} className="space-y-3">
              <div className="flex items-center gap-4">
                <Label htmlFor="firstName" className="w-20 text-sm">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  className="h-8 flex-1"
                  style={{ fontSize: '0.85rem' }}
                  placeholder="Enter first name"
                  defaultValue={selectedUser?.name?.split(' ')[0] || ''}
                  onChange={(e) => {
                    const firstName = e.target.value;
                    const surnameInput = document.getElementById('surname') as HTMLInputElement;
                    const usernameInput = document.getElementById('username') as HTMLInputElement;
                    if (surnameInput && usernameInput) {
                      const surname = surnameInput.value;
                      if (firstName && surname) {
                        usernameInput.value = `${firstName.toLowerCase()}${surname.toLowerCase()}`;
                      }
                    }
                  }}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="surname" className="w-20 text-sm">Surname</Label>
                <Input
                  id="surname"
                  name="surname"
                  className="h-8 flex-1"
                  style={{ fontSize: '0.85rem' }}
                  placeholder="Enter surname"
                  defaultValue={selectedUser?.name?.split(' ').slice(1).join(' ') || ''}
                  onChange={(e) => {
                    const surname = e.target.value;
                    const firstNameInput = document.getElementById('firstName') as HTMLInputElement;
                    const usernameInput = document.getElementById('username') as HTMLInputElement;
                    if (firstNameInput && usernameInput) {
                      const firstName = firstNameInput.value;
                      if (firstName && surname) {
                        usernameInput.value = `${firstName.toLowerCase()}${surname.toLowerCase()}`;
                      }
                    }
                  }}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="username" className="w-20 text-sm">Username</Label>
                <Input
                  id="username"
                  name="username"
                  className="h-8 flex-1 bg-gray-100 text-gray-500"
                  style={{ fontSize: '0.85rem' }}
                  placeholder="Auto-generated from name"
                  defaultValue={selectedUser?.username}
                  readOnly
                />
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="email" className="w-20 text-sm">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  className="h-8 flex-1"
                  style={{ fontSize: '0.85rem' }}
                  placeholder="Enter email address"
                  defaultValue={selectedUser?.email}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="password" className="w-20 text-sm">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="h-8 flex-1 bg-gray-100 text-gray-500"
                  style={{ fontSize: '0.85rem' }}
                  placeholder="Auto-generated on creation"
                  readOnly
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-20 text-sm">Discipline</Label>
                <div className="flex justify-between gap-2 flex-1">
                  {[
                    { value: "operations", label: "OPS", activeColor: "bg-blue-500 border-blue-600 text-white", inactiveColor: "bg-blue-50 border-blue-200 text-blue-700" },
                    { value: "commercial", label: "COMM", activeColor: "bg-green-500 border-green-600 text-white", inactiveColor: "bg-green-50 border-green-200 text-green-700" },
                    { value: "design", label: "DES", activeColor: "bg-purple-500 border-purple-600 text-white", inactiveColor: "bg-purple-50 border-purple-200 text-purple-700" },
                    { value: "she", label: "SHE", activeColor: "bg-orange-500 border-orange-600 text-white", inactiveColor: "bg-orange-50 border-orange-200 text-orange-700" },
                    { value: "qa", label: "QA", activeColor: "bg-red-500 border-red-600 text-white", inactiveColor: "bg-red-50 border-red-200 text-red-700" }
                  ].map((discipline) => (
                    <button
                      key={discipline.value}
                      type="button"
                      onClick={() => {
                        const disciplineInput = document.getElementById('disciplineValue') as HTMLInputElement;
                        if (disciplineInput) {
                          disciplineInput.value = discipline.value;
                        }
                        // Update button states
                        const buttons = document.querySelectorAll('[data-discipline-button]');
                        buttons.forEach(btn => {
                          const button = btn as HTMLButtonElement;
                          if (button.dataset.disciplineValue === discipline.value) {
                            button.className = `flex-1 px-3 py-1.5 text-xs font-medium uppercase rounded-full border transition-colors ${discipline.activeColor}`;
                          } else {
                            const otherDiscipline = [
                              { value: "operations", label: "OPS", activeColor: "bg-blue-500 border-blue-600 text-white", inactiveColor: "bg-blue-50 border-blue-200 text-blue-700" },
                              { value: "commercial", label: "COMM", activeColor: "bg-green-500 border-green-600 text-white", inactiveColor: "bg-green-50 border-green-200 text-green-700" },
                              { value: "design", label: "DES", activeColor: "bg-purple-500 border-purple-600 text-white", inactiveColor: "bg-purple-50 border-purple-200 text-purple-700" },
                              { value: "she", label: "SHE", activeColor: "bg-orange-500 border-orange-600 text-white", inactiveColor: "bg-orange-50 border-orange-200 text-orange-700" },
                              { value: "qa", label: "QA", activeColor: "bg-red-500 border-red-600 text-white", inactiveColor: "bg-red-50 border-red-200 text-red-700" }
                            ].find(d => d.value === button.dataset.disciplineValue);
                            if (otherDiscipline) {
                              button.className = `flex-1 px-3 py-1.5 text-xs font-medium uppercase rounded-full border transition-colors ${otherDiscipline.inactiveColor}`;
                            }
                          }
                        });
                      }}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium uppercase rounded-full border transition-colors ${discipline.inactiveColor}`}
                      data-discipline-button
                      data-discipline-value={discipline.value}
                    >
                      {discipline.label}
                    </button>
                  ))}
                </div>
                <input type="hidden" id="disciplineValue" name="discipline" value="" />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)} style={{ borderRadius: '9999px' }}>
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: '#333333', borderColor: '#333333', borderRadius: '9999px' }}>
                  {selectedUser ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4">
          {usersLoading ? (
            <div>Loading people...</div>
          ) : (
            (users as User[]).map((user: User) => (
              <Card key={user.id} className="material-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium">{user.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsUserDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setItemToDelete({ type: 'user', id: user.id, name: user.name });
                        setIsConfirmDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Person"
        description={`Are you sure you want to delete ${itemToDelete?.name}? This action cannot be undone.`}
      />
    </div>
  );
}