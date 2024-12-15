import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddPaymentDialog } from "./AddPaymentDialog";
import { AddExpenseDialog } from "./AddExpenseDialog";

export function FinanceHeader() {
  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
        Financial Overview
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </DialogTrigger>
          <AddPaymentDialog onClose={() => {
            const dialogElement = document.querySelector('[role="dialog"]');
            if (dialogElement) {
              const closeButton = dialogElement.querySelector('[data-state="closed"]');
              if (closeButton instanceof HTMLElement) {
                closeButton.click();
              }
            }
          }} />
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <AddExpenseDialog />
        </Dialog>
      </div>
    </div>
  );
}