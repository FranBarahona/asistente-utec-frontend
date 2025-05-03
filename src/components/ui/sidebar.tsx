
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet" // Added SheetTrigger import
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3.5rem" // Slightly wider for icon mode spacing
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  collapsible?: "offcanvas" | "icon" | "none"; // Add collapsible prop to context
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
    // Add collapsible prop here to pass down
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      collapsible = "icon", // Default collapsible mode set to icon
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // Read initial state from cookie if available, otherwise use defaultOpen
    const getInitialOpenState = () => {
        if (typeof window === 'undefined') return defaultOpen; // Avoid cookie access on server
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
            ?.split('=')[1];
        return cookieValue ? cookieValue === 'true' : defaultOpen;
    };

    const [_open, _setOpen] = React.useState(getInitialOpenState());
    const open = openProp ?? _open

    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // Set cookie, ensuring it runs only on client
        if (typeof window !== 'undefined') {
           document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
        }
      },
      [setOpenProp, open]
    )

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((prevOpen) => !prevOpen) // Toggle based on previous state for mobile
        : setOpen((prevOpen) => !prevOpen);      // Toggle based on previous state for desktop
    }, [isMobile, setOpen, setOpenMobile])


    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // Determine state based on 'open' and 'collapsible' mode for desktop
    const state = open || collapsible === 'none' ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        collapsible, // Pass collapsible down
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, collapsible]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON, // Use the updated constant
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar", // Changed bg-sidebar to has-[[data-variant=inset]]:bg-sidebar
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"; // Propagate collapsible here
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible: collapsibleProp, // Use collapsibleProp to avoid conflict
      className,
      children,
      ...props
    },
    ref
  ) => {
     // Get collapsible from context if not provided directly
    const context = useSidebar();
    const { isMobile, state, openMobile, setOpenMobile, collapsible: contextCollapsible } = context;
    const collapsible = collapsibleProp ?? contextCollapsible ?? "icon"; // Default to icon if not set


    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
             side === 'left' ? 'border-r border-sidebar-border' : 'border-l border-sidebar-border', // Add border color
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    // Mobile uses Sheet regardless of desktop collapsible mode
    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden" // Hide default close button
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">
                {children}
            </div>
          </SheetContent>
        </Sheet>
      )
    }

    // Desktop rendering
    return (
      <div
        ref={ref}
        className={cn(
          "group peer hidden md:block text-sidebar-foreground", // Added peer class
          // Floating and Inset variants need position fixed or absolute styling handled here or in specific variant logic
          (variant === 'floating' || variant === 'inset') && 'relative z-10', // Example for floating/inset
        )}
        data-state={state} // State derived from context (expanded/collapsed)
        data-collapsible={collapsible} // Explicitly set the collapsible mode
        data-variant={variant}
        data-side={side}
         // Add transition for smooth width/transform change
         style={{ transition: 'width 0.2s ease-linear, transform 0.2s ease-linear' }}
        {...props} // Pass remaining props here
      >
        {/* Desktop Sidebar Structure */}
        <div
            className={cn(
                "fixed inset-y-0 z-10 flex h-svh flex-col bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 ease-linear", // Added transform to transitions
                side === "left" ? "left-0 border-r border-sidebar-border" : "right-0 border-l border-sidebar-border", // Position and border color
                state === "expanded" ? "w-[--sidebar-width]" : (collapsible === 'icon' ? "w-[--sidebar-width-icon]" : "w-0 border-none"), // Width based on state and collapsible mode
                 // Handle offcanvas hiding with translate
                 collapsible === 'offcanvas' && state === 'collapsed' && (side === 'left' ? '-translate-x-full border-none' : 'translate-x-full border-none'),
                className // Allow overriding styles
            )}
        >
             {/* Content inside the sidebar */}
             {children}
        </div>

         {/* Spacer div to push content (only needed if not floating/inset AND not offcanvas collapsed) */}
         {variant !== 'floating' && variant !== 'inset' && !(collapsible === 'offcanvas' && state === 'collapsed') && (
            <div
              className={cn(
                "hidden md:block transition-[width] duration-200 ease-linear",
                 state === "expanded" ? "w-[--sidebar-width]" : (collapsible === 'icon' ? "w-[--sidebar-width-icon]" : "w-0") // Use w-0 for collapsed icon mode spacer too
                 // Offcanvas collapsed case handled by the outer condition
              )}
            />
          )}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"


const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button> & { asChild?: boolean } // Simplified props
>(({ className, onClick, asChild, ...props }, ref) => {
  const { toggleSidebar, isMobile } = useSidebar();

  // Don't render on mobile, SheetTrigger is used instead
  if (isMobile) return null;

  // Use a regular button on desktop
  return (
        <Button
            ref={ref}
            data-sidebar="trigger"
            variant="ghost"
            size="icon"
            className={cn(
                "hidden md:flex", // Only show on desktop
                className
             )}
             onClick={(event) => {
                onClick?.(event);
                toggleSidebar(); // Toggle sidebar state (desktop only)
             }}
            {...props} // Pass remaining props
            >
             <PanelLeft />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";


const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar, collapsible } = useSidebar()

  // Don't render rail if collapsible is none
  if (collapsible === 'none') return null;

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        // Hide rail if collapsible is icon or offcanvas and collapsed state
        "group-data-[collapsible=icon][data-state=collapsed]:hidden",
        "group-data-[collapsible=offcanvas][data-state=collapsed]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
    // Use peer selectors based on the Sidebar component's state and attributes
    // No need for context here if Sidebar has `peer` class
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background transition-[margin-left,margin-right] duration-200 ease-linear",

        // Default margin for expanded state (all modes except none)
        "md:peer-data-[side=left]:peer-data-[state=expanded]:ml-[--sidebar-width]",
        "md:peer-data-[side=right]:peer-data-[state=expanded]:mr-[--sidebar-width]",

        // Margin for icon collapsed state
        "md:peer-data-[side=left]:peer-data-[collapsible=icon]:peer-data-[state=collapsed]:ml-[--sidebar-width-icon]",
        "md:peer-data-[side=right]:peer-data-[collapsible=icon]:peer-data-[state=collapsed]:mr-[--sidebar-width-icon]",

        // No margin for offcanvas collapsed state
        "md:peer-data-[side=left]:peer-data-[collapsible=offcanvas]:peer-data-[state=collapsed]:ml-0",
        "md:peer-data-[side=right]:peer-data-[collapsible=offcanvas]:peer-data-[state=collapsed]:mr-0",

        // Margin for collapsible=none mode
        "md:peer-data-[side=left]:peer-data-[collapsible=none]:ml-[--sidebar-width]",
        "md:peer-data-[side=right]:peer-data-[collapsible=none]:mr-[--sidebar-width]",


        // Inset variant adjustments (apply margin and rounding) - Keep these as they are
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        // Adjust inset margins based on state and mode (left side example)
        "md:peer-data-[variant=inset]:peer-data-[side=left]:peer-data-[state=expanded]:ml-[calc(var(--sidebar-width)_+_theme(spacing.2))]",
        "md:peer-data-[variant=inset]:peer-data-[side=left]:peer-data-[collapsible=icon]:peer-data-[state=collapsed]:ml-[calc(var(--sidebar-width-icon)_+_theme(spacing.2))]",
        "md:peer-data-[variant=inset]:peer-data-[side=left]:peer-data-[collapsible=offcanvas]:peer-data-[state=collapsed]:ml-2", // Keep ml-2 for inset offcanvas
        "md:peer-data-[variant=inset]:peer-data-[side=left]:peer-data-[collapsible=none]:ml-[calc(var(--sidebar-width)_+_theme(spacing.2))]",
         // Adjust inset margins based on state and mode (right side example)
        "md:peer-data-[variant=inset]:peer-data-[side=right]:peer-data-[state=expanded]:mr-[calc(var(--sidebar-width)_+_theme(spacing.2))]",
        "md:peer-data-[variant=inset]:peer-data-[side=right]:peer-data-[collapsible=icon]:peer-data-[state=collapsed]:mr-[calc(var(--sidebar-width-icon)_+_theme(spacing.2))]",
        "md:peer-data-[variant=inset]:peer-data-[side=right]:peer-data-[collapsible=offcanvas]:peer-data-[state=collapsed]:mr-2", // Keep mr-2 for inset offcanvas
        "md:peer-data-[variant=inset]:peer-data-[side=right]:peer-data-[collapsible=none]:mr-[calc(var(--sidebar-width)_+_theme(spacing.2))]",


        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
    const { state, collapsible } = useSidebar();
    const isHidden = (collapsible === 'icon' || collapsible === 'offcanvas') && state === 'collapsed';
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isHidden && "hidden", // Hide input when icon or offcanvas collapsed
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
    const { state, collapsible } = useSidebar();
    const isCollapsed = state === 'collapsed' && (collapsible === 'icon' || collapsible === 'offcanvas');
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn(
        "flex flex-col gap-2 p-4 transition-opacity duration-200 ease-linear", // Use p-4 for more spacing
        isCollapsed && "items-center p-2", // Center items and reduce padding in icon/offcanvas mode collapsed
        className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
    const { state, collapsible } = useSidebar();
     const isCollapsed = state === 'collapsed' && (collapsible === 'icon' || collapsible === 'offcanvas');
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn(
        "flex flex-col gap-2 p-4 mt-auto transition-opacity duration-200 ease-linear", // Use p-4
         isCollapsed && "p-2 items-center", // Center items and reduce padding
        className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
    const { state, collapsible } = useSidebar();
     const isCollapsed = state === 'collapsed' && (collapsible === 'icon' || collapsible === 'offcanvas');
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn(
        "mx-4 w-auto bg-sidebar-border transition-opacity duration-200 ease-linear", // Use mx-4
        isCollapsed && "mx-2", // Reduce margin in icon/offcanvas mode collapsed
        className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
    const { state, collapsible } = useSidebar();
    const isCollapsed = state === 'collapsed' && (collapsible === 'icon' || collapsible === 'offcanvas');
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-0 overflow-auto", // Removed default gap-2
        // Hide scrollbar visually when icon/offcanvas collapsed, but allow scrolling if needed
        isCollapsed && "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
    const { state, collapsible } = useSidebar();
     const isCollapsed = state === 'collapsed' && (collapsible === 'icon' || collapsible === 'offcanvas');
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col px-2 py-1 transition-opacity duration-200 ease-linear", // Adjusted padding
         isCollapsed && "px-0 items-center", // No horizontal padding in icon/offcanvas mode collapsed
        className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"
  const { state, collapsible } = useSidebar();
  const isHidden = (collapsible === 'icon' || collapsible === 'offcanvas') && state === 'collapsed';

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-opacity duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        isHidden && "sr-only", // Hide label text visually but keep for screen readers
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
    const { state, collapsible } = useSidebar();
    const isHidden = (collapsible === 'icon' || collapsible === 'offcanvas') && state === 'collapsed';

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-opacity duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        isHidden && "hidden", // Hide action in icon/offcanvas collapsed mode
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => {
 const { state, collapsible } = useSidebar();
 const isCollapsed = state === 'collapsed' && (collapsible === 'icon' || collapsible === 'offcanvas');
 return (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn(
        "flex w-full min-w-0 flex-col gap-1 px-2", // Add padding here
         isCollapsed && "px-1 items-center", // Adjust padding for icon/offcanvas mode collapsed
        className)}
    {...props}
  />
 )
})
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative w-full", className)} // Ensure item takes full width
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center justify-start gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors duration-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-primary data-[active=true]:font-medium data-[active=true]:text-sidebar-primary-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground",
  // Icon and Offcanvas specific styles for collapsed state
  "group-data-[collapsible=icon]:group-data-[state=collapsed]:justify-center group-data-[collapsible=icon]:group-data-[state=collapsed]:size-9 group-data-[collapsible=icon]:group-data-[state=collapsed]:p-0",
  // Hide text span in offcanvas collapsed state, but keep icon
  "group-data-[collapsible=offcanvas]:group-data-[state=collapsed]:justify-center group-data-[collapsible=offcanvas]:group-data-[state=collapsed]:size-9 group-data-[collapsible=offcanvas]:group-data-[state=collapsed]:p-0 group-data-[collapsible=offcanvas]:group-data-[state=collapsed]:[&>span]:sr-only",
  "[&>span]:transition-opacity group-data-[collapsible=icon]:group-data-[state=collapsed]:[&>span]:sr-only", // Hide text in icon collapsed mode
  "[&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-9 text-sm", // Adjusted default height slightly
        sm: "h-8 text-xs", // Adjusted small height
        lg: "h-11 text-sm group-data-[collapsible=icon]:group-data-[state=collapsed]:!size-10 group-data-[collapsible=offcanvas]:group-data-[state=collapsed]:!size-10", // Adjusted large height and icon/offcanvas mode size
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)


const SidebarMenuButton = React.forwardRef<
  // Infer type based on asChild
   HTMLButtonElement | HTMLAnchorElement,
  (React.ComponentProps<"button"> | React.ComponentProps<"a">) & { // Allow button or anchor props
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | Omit<React.ComponentProps<typeof TooltipContent>, 'children'> // Allow TooltipContent props without children
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      children, // Extract children
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : typeof props.href === 'string' ? "a" : "button"; // Choose 'a' if href is present
    const { isMobile, state, collapsible } = useSidebar()

    const isCollapsed = state === 'collapsed' && (collapsible === 'icon' || collapsible === 'offcanvas');
    const showTooltip = tooltip && isCollapsed && !isMobile; // Show tooltip for both icon and offcanvas collapsed


     const buttonContent = (
        <>
            {/* Ensure children are passed correctly, especially icon and text */}
            {children}
        </>
    );


    const buttonElement = (
      <Comp
        ref={ref as any} // Use 'any' for ref due to conditional component type
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size, className }))}
        {...props} // Spread remaining props (like href, onClick, etc.)
      >
       {buttonContent}
      </Comp>
    )

     if (!showTooltip) {
      return buttonElement;
    }


    const tooltipContent = typeof tooltip === 'string' ? tooltip : tooltip?.side ? tooltip : { children: 'Tooltip' }; // Default content if needed


    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
         <TooltipContent
          side="right"
          align="center"
          // Don't use hidden prop, TooltipProvider handles visibility
          {...(typeof tooltip === 'object' ? tooltip : {})} // Spread tooltip props if object
        >
            {/* If tooltip is an object, prefer its content over button children for tooltip */}
             {typeof tooltip === 'object' && tooltip.children ? tooltip.children : (typeof tooltip === 'string' ? tooltip : '')}
        </TooltipContent>
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
    const { state, collapsible } = useSidebar();
    const isHidden = (collapsible === 'icon' || collapsible === 'offcanvas') && state === 'collapsed';

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1/2 -translate-y-1/2 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        // Adjust top based on button size if needed (example)
        // "peer-data-[size=sm]/menu-button:top-1",
        // "peer-data-[size=default]/menu-button:top-1.5",
        // "peer-data-[size=lg]/menu-button:top-2.5",
        isHidden && "hidden", // Hide action in icon/offcanvas collapsed mode
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
   const { state, collapsible } = useSidebar();
   const isHidden = (collapsible === 'icon' || collapsible === 'offcanvas') && state === 'collapsed';
   return (
      <div
        ref={ref}
        data-sidebar="menu-badge"
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none transition-opacity",
          "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
          // Adjust top based on button size if needed
          // "peer-data-[size=sm]/menu-button:top-1",
          // "peer-data-[size=default]/menu-button:top-1.5",
          // "peer-data-[size=lg]/menu-button:top-2.5",
           isHidden && "hidden", // Hide badge in icon/offcanvas collapsed mode
          className
        )}
        {...props}
      />
   )
})
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = true, ...props }, ref) => { // Default showIcon to true
   const { state, collapsible } = useSidebar();
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  const isCollapsed = state === 'collapsed' && (collapsible === 'icon' || collapsible === 'offcanvas');
  const isIconModeCollapsed = collapsible === 'icon' && state === 'collapsed';
  const isOffcanvasCollapsed = collapsible === 'offcanvas' && state === 'collapsed';


   // Hide skeleton if offcanvas collapsed completely
    if (isOffcanvasCollapsed) {
        return null;
    }


  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn(
          "flex h-9 items-center gap-2 rounded-md px-2",
           isIconModeCollapsed && "h-9 w-9 justify-center p-0", // Adjust for icon mode
          className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className={cn("size-4 rounded-sm", isIconModeCollapsed && "size-5")} // Slightly larger icon in icon mode
          data-sidebar="menu-skeleton-icon"
        />
      )}
       {!isCollapsed && ( // Only show text skeleton if not collapsed (icon or offcanvas)
        <Skeleton
            className="h-4 flex-1 max-w-[--skeleton-width]"
            data-sidebar="menu-skeleton-text"
            style={
            {
                "--skeleton-width": width,
            } as React.CSSProperties
            }
        />
       )}
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => {
    const { state, collapsible } = useSidebar();
    const isHidden = (collapsible === 'icon' || collapsible === 'offcanvas') && state === 'collapsed';
  return (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-[calc(theme(spacing.2)_+_theme(spacing.4))] flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border py-1 pl-3", // Adjusted margin/padding
      isHidden && "hidden", // Hide submenus in icon/offcanvas collapsed mode
      className
    )}
    {...props}
  />
 )
})
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} data-sidebar="menu-sub-item" {...props} />) // Added data attribute
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
   HTMLAnchorElement | HTMLButtonElement, // Allow button or anchor
   (React.ComponentProps<"a"> | React.ComponentProps<"button">) & { // Allow anchor or button props
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
   const Comp = asChild ? Slot : typeof props.href === 'string' ? "a" : "button"; // Choose 'a' if href is present
    const { state, collapsible } = useSidebar();
    const isHidden = (collapsible === 'icon' || collapsible === 'offcanvas') && state === 'collapsed';

  return (
    <Comp
      ref={ref as any}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-8 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground/90 outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        // Removed text-sidebar-accent-foreground from svg base styles
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium", // Style active state
        size === "sm" && "h-7 text-xs",
        size === "md" && "text-sm",
        isHidden && "hidden", // Hide sub-buttons in icon/offcanvas collapsed mode
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
