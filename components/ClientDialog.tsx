'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, User, Phone } from 'lucide-react'
import { formatPhone, validatePhone } from '@/lib/utils'

interface ClientDialogProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: () => void
  client?: {
    id: string
    name: string
    phone: string
    expiryDate: string
  }
}

export default function ClientDialog({ isOpen, onClose, onClientAdded, client }: ClientDialogProps) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    phone: client?.phone || '',
    expiryDate: client?.expiryDate ? new Date(client.expiryDate).toISOString().slice(0, 16) : '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido'
    else if (!validatePhone(formData.phone)) newErrors.phone = 'Formato de teléfono inválido'
    if (!client && !formData.expiryDate) newErrors.expiryDate = 'La fecha de expiración es requerida'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const url = client ? `/api/clients/${client.id}` : '/api/clients'
      const method = client ? 'PUT' : 'POST'
      const requestBody = client ? {
        name: formData.name.trim(),
        phone: formatPhone(formData.phone)
      } : {
        name: formData.name.trim(),
        phone: formatPhone(formData.phone),
        expiryDate: new Date(formData.expiryDate).toISOString()
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        onClientAdded()
        handleClose()
      } else {
        const errorData = await response.json()
        setErrors({ general: errorData.message || 'Error al guardar cliente' })
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Intenta nuevamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', phone: '', expiryDate: '' })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{client ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input
              id="name"
              placeholder="Ej: Juan Pérez García"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Número de WhatsApp</Label>
            <Input
              id="phone"
              placeholder="Ej: +51 987654321"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Fecha de Expiración</Label>
            <Input
              id="expiryDate"
              type="datetime-local"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
            />
            {errors.expiryDate && <p className="text-sm text-red-600">{errors.expiryDate}</p>}
          </div>

          {errors.general && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errors.general}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : (client ? 'Actualizar Cliente' : 'Agregar Cliente')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}