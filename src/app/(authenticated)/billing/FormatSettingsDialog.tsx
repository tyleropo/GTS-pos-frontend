"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Settings2 } from "lucide-react";
import {
    DocumentFormatSettings,
    DEFAULT_FORMAT_SETTINGS,
} from "@/src/types/billing";

interface FormatSettingsDialogProps {
    settings: DocumentFormatSettings;
    onSettingsChange: (settings: DocumentFormatSettings) => void;
    children?: React.ReactNode;
}

export function FormatSettingsDialog({
    settings,
    onSettingsChange,
    children,
}: FormatSettingsDialogProps) {
    const [open, setOpen] = useState(false);
    const [localSettings, setLocalSettings] =
        useState<DocumentFormatSettings>(settings);

    const handleSave = () => {
        onSettingsChange(localSettings);
        setOpen(false);
    };

    const handleReset = () => {
        setLocalSettings(DEFAULT_FORMAT_SETTINGS);
    };

    const updateSetting = (
        key: keyof DocumentFormatSettings,
        value: string | boolean
    ) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <Settings2 className="h-4 w-4 mr-2" />
                        Format Settings
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Document Format Settings</DialogTitle>
                    <DialogDescription>
                        Customize the appearance of your billing statements before exporting.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Company Name */}
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                            id="companyName"
                            value={localSettings.companyName}
                            onChange={(e) => updateSetting("companyName", e.target.value)}
                            placeholder="Enter company name"
                        />
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                        <Label htmlFor="fontSize">Font Size</Label>
                        <Select
                            value={localSettings.fontSize}
                            onValueChange={(value) => updateSetting("fontSize", value)}
                        >
                            <SelectTrigger id="fontSize">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Color Scheme */}
                    <div className="space-y-2">
                        <Label htmlFor="colorScheme">Color Scheme</Label>
                        <Select
                            value={localSettings.colorScheme}
                            onValueChange={(value) => updateSetting("colorScheme", value)}
                        >
                            <SelectTrigger id="colorScheme">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default (Gray)</SelectItem>
                                <SelectItem value="blue">Blue</SelectItem>
                                <SelectItem value="green">Green</SelectItem>
                                <SelectItem value="monochrome">Monochrome</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Page Orientation */}
                    <div className="space-y-2">
                        <Label htmlFor="orientation">Page Orientation</Label>
                        <Select
                            value={localSettings.pageOrientation}
                            onValueChange={(value) => updateSetting("pageOrientation", value)}
                        >
                            <SelectTrigger id="orientation">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="portrait">Portrait</SelectItem>
                                <SelectItem value="landscape">Landscape</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Header Text */}
                    <div className="space-y-2">
                        <Label htmlFor="headerText">Header Text (Optional)</Label>
                        <Input
                            id="headerText"
                            value={localSettings.headerText || ""}
                            onChange={(e) => updateSetting("headerText", e.target.value)}
                            placeholder="Enter custom header text"
                        />
                    </div>

                    {/* Footer Text */}
                    <div className="space-y-2">
                        <Label htmlFor="footerText">Footer Text (Optional)</Label>
                        <Input
                            id="footerText"
                            value={localSettings.footerText || ""}
                            onChange={(e) => updateSetting("footerText", e.target.value)}
                            placeholder="Enter custom footer text"
                        />
                    </div>

                    {/* Include Logo */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="includeLogo"
                            checked={localSettings.includeLogo}
                            onCheckedChange={(checked) =>
                                updateSetting("includeLogo", checked as boolean)
                            }
                        />
                        <Label
                            htmlFor="includeLogo"
                            className="text-sm font-normal cursor-pointer"
                        >
                            Include Company Logo
                        </Label>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                        <Label className="text-base font-semibold">Column Visibility</Label>
                        <div className="grid grid-cols-1 gap-2">
                             <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="showQuantity"
                                    checked={localSettings.showQuantity ?? true}
                                    onCheckedChange={(checked) =>
                                        updateSetting("showQuantity", checked as boolean)
                                    }
                                />
                                <Label
                                    htmlFor="showQuantity"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Show Quantity
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="showUnitPrice"
                                    checked={localSettings.showUnitPrice ?? true}
                                    onCheckedChange={(checked) =>
                                        updateSetting("showUnitPrice", checked as boolean)
                                    }
                                />
                                <Label
                                    htmlFor="showUnitPrice"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Show Unit Price
                                </Label>
                            </div>
                           {/* Show Line Total can be redundant if we have Amount, but let's keep it as an option if user wants to hide the right-most column details - wait "Amount" is the line total. Maybe "showLineTotal" is redundant with "Amount", let's assume Amount is always shown, but maybe breakdown is what is toggled. 
                           Actually, Amount column is usually required. Let's assume user wants to toggle details. 
                           But user asked "allow to select which columns to be included". 
                           Let's assume "Quantity" and "Unit Price" are the main optional ones. "Line Total" is the Amount column.
                           Let's add Amount visibility too just in case? No, amount is critical.
                           Let's stick to Quantity and Unit Price for now as distinct columns.
                           */}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleReset}>
                        Reset to Default
                    </Button>
                    <Button onClick={handleSave}>Apply Settings</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
