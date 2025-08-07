"use client";

import type React from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Gamepad2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Bem-vindo de volta!
          </CardTitle>
          <CardDescription>
            Entre na sua conta para continuar compartilhando seus momentos
            épicos
          </CardDescription>
        </CardHeader>

        <div className="flex items-center justify-center space-x-2 mt-2">
          <Button className="w-110" type="button" onClick={signInWithGoogle}>
            Entrar com Google
          </Button>
        </div>
      </Card>
    </div>
  );
}
