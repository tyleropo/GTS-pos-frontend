"use client"
import { cn } from "@/src/lib/utils"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmpassword, setConfirmPassword] = useState("")
  const [error , setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirmpassword) {
    setError("Passwords do not match")
    return
  }


    try{
      const response = await fetch("http://localhost:8000/api/register",{
        method:"POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name,email,password,password_confirmation: confirmpassword}),
      })
      const data = await response.json()

      if (!response.ok) throw  new Error(data.message || "Register Failed")
      router.push("/login")
    }
    catch(err: any){
      setError(err.message)
    }
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
           <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create Account</h1>
                <p className="text-muted-foreground text-balance">
                  Create your GTS Mktg account
                </p>
              </div>
               {error && (
                <div className="text-sm text-red-500 text-center">{error}</div>
              )}
               <div className="grid gap-3">
                <Label htmlFor="email">Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input 
                id="password" 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                 />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Confirm Password</Label>
                </div>
                <Input 
                id="password_confirmation"
                 type="password"
                  required
                  value={confirmpassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">
                Sign up
              </Button>
              
              <div className="text-center text-sm">
               Already have an account?{" "}
                <a href="/login" className="underline underline-offset-4">
                  Login
                </a>
              </div>
            </div>
          </form>
         
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
