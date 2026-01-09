"use client"

export default function SettingsPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-base font-semibold mb-1">General Settings</h2>
                <p className="text-xs text-muted-foreground mb-6">Manage your application preferences.</p>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded border border-border">
                        <span className="text-sm font-medium">Email Notifications</span>
                        <div className="h-5 w-9 bg-muted rounded-full relative cursor-not-allowed">
                            <div className="h-3 w-3 bg-background rounded-full absolute top-1 left-1 shadow-sm" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded border border-border">
                        <span className="text-sm font-medium">Two-Factor Auth</span>
                        <span className="text-xs text-muted-foreground">Coming Soon</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
