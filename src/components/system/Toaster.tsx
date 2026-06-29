import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      richColors={false}
      position="bottom-right"
      closeButton={false}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            'border border-edge bg-bg-elev text-text-primary shadow-float rounded-lg font-sans text-sm',
          title: 'text-text-primary font-medium',
          description: 'text-text-secondary text-xs',
          success: '!border-success/30',
          error: '!border-critical/30',
          warning: '!border-warning/30'
        }
      }}
    />
  )
}
