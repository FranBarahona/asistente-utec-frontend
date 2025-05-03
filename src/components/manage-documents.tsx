
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FilePlus, Trash2 } from 'lucide-react';

// Placeholder data for documents
const placeholderDocuments = [
  { id: 'doc1', name: 'Reglamento Académico.pdf', size: '1.2 MB', uploaded: '2024-07-20' },
  { id: 'doc2', name: 'Normativa de Pasantías.docx', size: '850 KB', uploaded: '2024-07-19' },
  { id: 'doc3', name: 'Calendario Académico 2024.pdf', size: '500 KB', uploaded: '2024-07-18' },
];

const ManageDocuments: React.FC = () => {
  const handleUpload = () => {
    // Simulate file upload
    alert('Simulating document upload...');
    // TODO: Implement actual file upload logic
  };

  const handleDelete = (docId: string) => {
    // Simulate document deletion
    alert(`Simulating deletion of document ${docId}...`);
    // TODO: Implement actual document deletion logic
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Documents</CardTitle>
        <Button onClick={handleUpload} size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload New Document
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Admins can upload, view, and delete documents that the chatbot uses for context.
        </p>
        <div className="space-y-4">
          {placeholderDocuments.length > 0 ? (
            placeholderDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-secondary/50">
                <div className="flex items-center gap-3">
                   <FilePlus className="h-5 w-5 text-muted-foreground" />
                   <div>
                     <p className="font-medium">{doc.name}</p>
                     <p className="text-sm text-muted-foreground">
                       Size: {doc.size} | Uploaded: {doc.uploaded}
                     </p>
                   </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(doc.id)}
                  aria-label={`Delete ${doc.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">No documents uploaded yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ManageDocuments;
