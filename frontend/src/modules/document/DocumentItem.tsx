import { useState } from 'react';
import { IconFileTypePdf, IconDownload, IconExternalLink } from '@tabler/icons-react';
import { useDeleteDocumentMutation } from './mutations';
import { downloadDocument } from './api';
import type { DocumentItem as DocumentItemType } from './types';

type DocumentItemProps = { document: DocumentItemType; canManage?: boolean };

export function DocumentItem({ document, canManage = false }: DocumentItemProps) {
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
      <IconFileTypePdf size={25} stroke={1.4} aria-hidden="true" />
      <strong className="document-name">{document.title || document.originalName}</strong>
      {document.sizeBytes > 0 && <span className="document-size">{new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(document.sizeBytes / 1024 / 1024)} MB</span>}
      <div className="document-item-actions">
        <a href={document.url} target="_blank" rel="noopener noreferrer" aria-label={`Öppna ${document.title || document.originalName} (PDF)`}>Öppna <IconExternalLink size={17} aria-hidden="true" /></a>
        <button type="button" onClick={handleDownload} disabled={downloading} aria-label={`Ladda ner ${document.title || document.originalName}`}>{downloading ? 'Hämtar…' : 'Ladda ner'} <IconDownload size={17} aria-hidden="true" /></button>
        {canManage && <button type="button" onClick={() => deleteDocument.mutate({propertyId: document.propertyId, documentId: document.documentId})} disabled={deleteDocument.isPending}>{deleteDocument.isPending ? 'Tar bort…' : 'Ta bort'}</button>}
      </div>
      {downloadError && <p className="form-error" role="alert">{downloadError}</p>}
      {canManage && deleteDocument.error instanceof Error && <p className="form-error" role="alert">{deleteDocument.error.message}</p>}
    </article>
  );
}
