
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FilePlus, Trash2, Loader2, Eye } from 'lucide-react'; // Added Eye icon
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Document {
  id: number;
  filename: string;
  size: number; // Size in MB
  uploaded_at: string;
  path: string;
}

const ManageDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const apiUrlBase = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchDocuments = async () => {
    if (!apiUrlBase) {
      toast({
        title: "API Error",
        description: "Backend URL is not configured. Cannot fetch documents.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrlBase}/document/all`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Fallo al obtener documentos. Status: ${response.status}` }));
        throw new Error(errorData.message || `Failed to fetch documents. Status: ${response.status}`);
      }
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        setDocuments(result.data);
      } else {
        if(Array.isArray(result)){
            setDocuments(result);
        } else {
            throw new Error("Invalid data format received from API.");
        }
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error Fetching Documents",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      setDocuments([]); // Clear documents on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileToUpload(event.target.files[0]);
    } else {
      setFileToUpload(null);
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "default",
      });
      return;
    }
    if (!apiUrlBase) {
      toast({
        title: "API Error",
        description: "Backend URL is not configured. Cannot upload document.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    setIsUploading(true);

    try {
      const response = await fetch(`${apiUrlBase}/document/upload`, {
        method: 'POST',
        body: formData,
        // Do not set Content-Type header, browser will set it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `subida fallida. Status: ${response.status}` }));
        throw new Error(errorData.message || `Upload failed. Status: ${response.status}`);
      }

      const result = await response.json();
      toast({
        title: "Upload Successful",
        description: `${fileToUpload.name} ha sido subido`,
      });
      setFileToUpload(null); // Reset file input
      const fileInputElement = document.getElementById('file-upload-input') as HTMLInputElement;
      if (fileInputElement) {
        fileInputElement.value = '';
      }
      fetchDocuments(); // Refresh document list
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };


  const handleDelete = async (docId: number, docName: string) => {
    if (!apiUrlBase) {
      toast({
        title: "API Error",
        description: "Backend URL is not configured. Cannot delete document.",
        variant: "destructive",
      });
      return;
    }
    setIsDeleting(docId);
    try {
      const response = await fetch(`${apiUrlBase}/document/${docId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Eliminacion fallida. Status: ${response.status}` }));
        throw new Error(errorData.message || `Deletion failed for ${docName}. Status: ${response.status}`);
      }
      const result = await response.json();
      toast({
        title: "Documento eliminado",
        description: `${docName} ha sido eliminado. ${result.message || ''}`,
      });
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
    } catch (error) {
      console.error(`Error eliminando documento ${docId}:`, error);
      toast({
        title: "Eliminacion fallida",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewDocument = (path: string) => {
    window.open(path, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD format
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Gestionar documentos</CardTitle>
        <div className="flex items-center gap-2">
          <input 
            id="file-upload-input"
            type="file" 
            onChange={handleFileSelect} 
            className="text-sm file:mr-2 file:py-1.5 file:px-2 file:rounded-md file:border file:border-input file:bg-transparent file:text-sm file:font-medium hover:file:bg-accent hover:file:text-accent-foreground disabled:opacity-50"
            disabled={isUploading}
          />
          <Button onClick={handleUpload} size="sm" disabled={isUploading || !fileToUpload}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isUploading ? 'Subiendo...' : 'Subido'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
        Los administradores pueden cargar, ver y eliminar documentos que el chatbot utiliza para el contexto.
        </p>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <FilePlus className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        Size: {doc.size.toFixed(2)} MB | Uploaded: {formatDate(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary hover:bg-primary/10"
                        onClick={() => handleViewDocument(doc.path)}
                        aria-label={`Ver ${doc.filename}`}
                      >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          disabled={isDeleting === doc.id}
                          aria-label={`Borrar ${doc.filename}`}
                        >
                          {isDeleting === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Estas seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el documento
                            "{doc.filename}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting === doc.id}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(doc.id, doc.filename)}
                            disabled={isDeleting === doc.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting === doc.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No documents uploaded yet.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageDocuments;
