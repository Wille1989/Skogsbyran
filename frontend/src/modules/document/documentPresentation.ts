import { IconBook, IconFileDescription, IconFileAnalytics, IconMap, IconNote, IconMap2, IconHome, IconFileTypePdf } from '@tabler/icons-react';
import type { DocumentItem } from './types';

const presentations = [
    { label: 'Prospekt (pdf)', icon: IconBook, type: 'prospect', title: /^prospekt(?:\s|$)/i },
    { label: 'Anbud', icon: IconFileDescription, type: 'bid_form', title: /^(anbud|budblankett)(?:\s|$)/i },
    { label: 'Skogsbruksplan', icon: IconFileAnalytics, title: /^skogsbruksplan(?:\s|$)/i },
    { label: 'Skogskarta', icon: IconMap, title: /^skogskart(?:a|or)(?:\s|$)/i },
    { label: 'Fastighetskartor', icon: IconNote, type: 'property_map', title: /^fastighetskart(?:a|or)(?:\s|$)/i },
    { label: 'Vägkarta', icon: IconMap2, title: /^vägkart(?:a|or)(?:\s|$)/i },
    { label: 'Planskisser', icon: IconHome, title: /^(planskiss(?:er)?|planritning(?:ar)?)(?:\s|$)/i },
];

export function documentPresentation(document: DocumentItem) {
    const title = document.title.trim();
    const index = presentations.findIndex(item => item.type === document.type || item.title.test(title));
    const presentation = presentations[index];
    return {
        icon: presentation?.icon ?? IconFileTypePdf,
        label: presentation?.label ?? (title || document.originalName),
        order: index < 0 ? presentations.length : index,
    };
}

