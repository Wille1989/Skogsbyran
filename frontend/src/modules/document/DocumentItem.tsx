import { useState } from 'react';
import { IconDownload } from '@tabler/icons-react';
import { documentPresentation } from './documentPresentation';
import { useDeleteDocumentMutation } from './mutations';
import { downloadDocument } from './api';
import type { DocumentItem as DocumentItemType } from './types';

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
      <a className="document-link" href={document.url} target="_blank" rel="noopener noreferrer" aria-label={`Öppna ${document.title || label} (PDF, ny flik)`}>
        <Icon size={56} stroke={1.35} aria-hidden="true" />
        <span className="document-name">{label}</span>
      </a>
      <div className="document-item-actions">
        <button type="button" onClick={handleDownload} disabled={downloading} aria-label={`Ladda ner ${document.title || document.originalName}`}><span className="document-action-label">{downloading ? 'Hämtar…' : 'Ladda ner'}</span> <IconDownload size={17} aria-hidden="true" /></button>
        {canManage && <button type="button" onClick={() => deleteDocument.mutate({propertyId: document.propertyId, documentId: document.documentId})} disabled={deleteDocument.isPending}>{deleteDocument.isPending ? 'Tar bort…' : 'Ta bort'}</button>}
      </div>
      {downloadError && <p className="form-error" role="alert">{downloadError}</p>}
      {canManage && deleteDocument.error instanceof Error && <p className="form-error" role="alert">{deleteDocument.error.message}</p>}
    </article>
  );
}
