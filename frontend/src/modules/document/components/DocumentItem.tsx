import { useState } from 'react';
import { IconDownload } from '@tabler/icons-react';
import { documentPresentation } from '../helpers/documentPresentation';
import { useDeleteDocumentMutation } from '../hooks/mutations';
import { downloadDocument } from '../api/api';
import type { DocumentItem as DocumentItemType } from '../types/types';

type DocumentItemProps = { document: DocumentItemType; canManage?: boolean };

export function DocumentItem({ document, canManage = false }: DocumentItemProps) {
  const { icon: Icon, label } = documentPresentation(document);
  const deleteDocument = useDeleteDocumentMutation();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setDownloadError('');
    try {
      const blob = await downloadDocument(document.url);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName || document.title;
      window.document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError('Det gick inte att ladda ner dokumentet. Försök igen eller öppna PDF-filen och spara den därifrån.');
    } finally { setDownloading(false); }
  }
  return (
    <article className="document-item">
      <Icon className="document-icon" size={32} stroke={1.5} aria-hidden="true" />
      <div className="document-copy">
        <h3 className="document-name">{document.title || label}</h3>
        <p>PDF{canManage ? " · Sparat" : ""}</p>
      </div>
      <div className="document-item-actions">
        <a className="document-link" href={document.url} target="_blank" rel="noopener noreferrer" aria-label={"Öppna " + (document.title || label) + " (PDF, ny flik)"}>Öppna PDF</a>
        <button type="button" onClick={handleDownload} disabled={downloading} aria-label={`Ladda ner ${document.title || document.originalName}`}><span className="document-action-label">{downloading ? 'Hämtar…' : 'Ladda ner'}</span> <IconDownload size={17} aria-hidden="true" /></button>
        {canManage && <button type="button" onClick={() => deleteDocument.mutate({propertyId: document.propertyId, documentId: document.documentId})} disabled={deleteDocument.isPending}>{deleteDocument.isPending ? 'Tar bort…' : 'Ta bort'}</button>}
      </div>
      {downloadError && <p className="form-error" role="alert">{downloadError}</p>}
      {canManage && deleteDocument.error instanceof Error && <p className="form-error" role="alert">{deleteDocument.error.message}</p>}
    </article>
  );
}
