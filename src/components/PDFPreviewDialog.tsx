import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface PDFPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  generatePDF: () => Promise<jsPDF>;
  fileName: string;
}

const PDFPreviewDialog = ({ isOpen, onClose, title, generatePDF, fileName }: PDFPreviewDialogProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      loadPDFPreview();
    } else {
      // Cleanup URL when dialog closes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      setPdfDoc(null);
    }
  }, [isOpen]);

  const loadPDFPreview = async () => {
    setIsLoading(true);
    try {
      const doc = await generatePDF();
      setPdfDoc(doc);
      
      // Generate blob URL for preview
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfDoc) {
      pdfDoc.save(fileName);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Preview: {title}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-[70vh] border rounded-lg overflow-hidden bg-muted">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Generating preview...</span>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Failed to generate preview
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={!pdfDoc || isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewDialog;
