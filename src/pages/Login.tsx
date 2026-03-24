import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, Lock, ArrowRight, Rocket, AlertCircle, CheckCircle2 } from 'lucide-react'
import logoUrl from '../assets/lead-finder-zion-8b551.jpg'
import { cn } from '@/lib/utils'
import { ZionGlobalBackground } from '@/components/ZionGlobalBackground'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const from = location.state?.from?.pathname || '/'

  const validateEmail = (val: string) => {
    if (!val) {
      setEmailError('O e-mail é obrigatório')
      return false
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(val)) {
      setEmailError('Formato de e-mail inválido')
      return false
    }
    setEmailError('')
    return true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const isEmailValid = validateEmail(email)
    if (!isEmailValid || !password) {
      if (!password) {
        toast({
          variant: 'destructive',
          title: (
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Atenção
            </div>
          ),
          description: 'A senha é obrigatória.',
        })
      }
      return
    }

    setLoading(true)
    try {
      const { error } = await login(email, password)
      if (error) {
        toast({
          variant: 'destructive',
          title: (
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Erro de autenticação
            </div>
          ),
          description: error.message || 'E-mail ou senha inválidos.',
        })
      } else {
        setSuccessMessage('Login realizado com sucesso! Redirecionando...')
        setTimeout(() => {
          navigate(from, { replace: true })
        }, 1200)
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: (
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Erro inesperado
          </div>
        ),
        description: 'Ocorreu um erro ao tentar fazer login.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-[#f9fafb] md:bg-[#020617] p-4 overflow-hidden relative">
      <ZionGlobalBackground fallbackVariant="light" />

      {/* Overlays dark background gradient on desktop only to avoid conflicting with mobile white fallback */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#020617]/70 pointer-events-none z-0 hidden md:block" />

      {/* z-20 applied here to ensure the card is always on the top plane */}
      <Card
        className="w-full max-w-md bg-gradient-to-b from-white to-[#f9fafb] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border-slate-100 rounded-2xl animate-fade-in-up-slow motion-reduce:animate-none z-20 relative !overflow-visible"
        style={{ padding: '0px' }}
      >
        <div className="p-6 sm:p-10">
          <CardHeader style={{ padding: 0 }} className="space-y-3 flex flex-col items-center pb-8">
            <div className="flex flex-col items-center relative w-full mb-1">
              <div className="w-40 sm:w-56 h-auto overflow-hidden flex justify-center relative z-10 drop-shadow-sm">
                <img
                  src={logoUrl}
                  alt="Lead Finder Zion"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -top-4 -right-2 sm:-top-6 sm:-right-4 z-0 animate-float-subtle motion-reduce:animate-none">
                <div className="animate-spin-slow motion-reduce:animate-none">
                  <Rocket className="h-8 w-8 sm:h-12 sm:w-12 text-primary opacity-20" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-1.5 mt-2">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
                Acesso ao Sistema
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Insira suas credenciais para acessar sua conta.
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent style={{ padding: 0 }} className="space-y-6">
              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-[#10b981] flex items-center animate-fade-in motion-reduce:animate-none">
                  <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium">{successMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  E-mail
                </Label>
                <div className="relative group">
                  <Mail
                    className={cn(
                      'absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 motion-reduce:transition-none',
                      emailError
                        ? 'text-[#ef4444]'
                        : 'text-slate-400 group-focus-within:text-[#3b82f6]',
                    )}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com.br"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) validateEmail(e.target.value)
                    }}
                    onBlur={(e) => {
                      if (e.target.value) validateEmail(e.target.value)
                    }}
                    className={cn(
                      'pl-10 h-[44px] transition-all duration-300 bg-white shadow-sm !outline-none focus:!ring-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 motion-reduce:transition-none motion-reduce:transform-none',
                      emailError
                        ? 'border-[#ef4444] text-[#ef4444] focus:!border-[#ef4444] focus-visible:!border-[#ef4444] focus:!shadow-[0_0_8px_rgba(239,68,68,0.3)] focus-visible:!shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                        : 'border-slate-200 focus:!border-[#3b82f6] focus-visible:!border-[#3b82f6] focus:!shadow-[0_0_8px_rgba(59,130,246,0.3)] focus-visible:!shadow-[0_0_8px_rgba(59,130,246,0.3)]',
                    )}
                    disabled={loading || !!successMessage}
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-[#ef4444] flex items-center mt-1.5 animate-fade-in motion-reduce:animate-none">
                    <AlertCircle className="h-4 w-4 mr-1.5" /> {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Senha
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#3b82f6] transition-colors duration-300 motion-reduce:transition-none" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-[44px] transition-all duration-300 bg-white shadow-sm border-slate-200 !outline-none focus:!ring-0 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!border-[#3b82f6] focus-visible:!border-[#3b82f6] focus:!shadow-[0_0_8px_rgba(59,130,246,0.3)] focus-visible:!shadow-[0_0_8px_rgba(59,130,246,0.3)] motion-reduce:transition-none motion-reduce:transform-none"
                    disabled={loading || !!successMessage}
                  />
                </div>
                <div className="flex justify-end mt-1.5">
                  <a
                    href="#"
                    className="text-sm text-blue-600 hover:text-[#f97316] transition-colors duration-300 font-medium hover:underline motion-reduce:transition-none"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
              </div>
            </CardContent>

            <CardFooter
              style={{
                padding: 0,
                backgroundColor: 'transparent',
                borderTop: 'none',
                marginTop: '32px',
              }}
            >
              <Button
                type="submit"
                className="w-full h-[48px] bg-primary hover:bg-[#f97316] text-white shadow-sm hover:shadow-[0_8px_16px_rgba(249,115,22,0.3)] hover:-translate-y-[2px] transition-all duration-300 cursor-pointer text-base font-semibold group motion-reduce:transition-none motion-reduce:transform-none"
                disabled={loading || !!successMessage}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin motion-reduce:animate-none" />
                    Autenticando...
                  </>
                ) : successMessage ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Autenticado
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="ml-2 h-5 w-5 opacity-80 group-hover:translate-x-1 transition-transform duration-300 motion-reduce:transition-none motion-reduce:transform-none" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </div>
      </Card>
    </div>
  )
}
