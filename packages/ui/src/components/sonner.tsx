import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      {...props}
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      expand={false}
      visibleToasts={4}
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-[0_8px_30px_rgba(35,31,32,0.08)] group-[.toaster]:rounded-lg group-[.toaster]:px-4 group-[.toaster]:py-3",
          title:
            "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:tracking-tight",
          description:
            "group-[.toast]:text-xs group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary",
          error:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-destructive",
          info: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-border",
          warning:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-500",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md",
        },
      }}
    />
  );
};

export { Toaster };
