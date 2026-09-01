import { useState } from "react";
import { type DragEvent } from "react";

export function useFileDropContainer(onFilesDrop: (files: File[]) => void, onReorder: (from: number, to: number) => void) 
{
      const [dragIndex, setDragIndex] = useState<number | null>(null);

      type DragHandler = (event: DragEvent<HTMLDivElement>) => void;

      const withDragEvent = (handler: DragHandler): DragHandler => 
      {
            return(e) => 
            {
                  e.preventDefault();
                  e.stopPropagation();
                  handler(e);
            }
      }

      const onDragOverActivate = withDragEvent((e) => 
      {
            e.currentTarget.classList.add('drag-over');
      });

      const onDropFiles = withDragEvent((e) => 
      {
            e.currentTarget.classList.remove('drag-over');
            onFilesDrop(Array.from(e.dataTransfer.files));
      });

      const onDragLeaveDeactivate = withDragEvent((e) => 
      {
            e.currentTarget.classList.remove('drag-over');
      });

      const onDragOver = (e: React.DragEvent<HTMLDivElement>) => 
      {
            e.preventDefault();
      };

      const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => 
      {
            e.dataTransfer.effectAllowed = 'move';
            setDragIndex(index);
      };

      const onDragEnd = () => 
      {
            setDragIndex(null);
      }

      const onDrop = (e: React.DragEvent<HTMLDivElement>,index: number) => 
      {
            e.stopPropagation();
            e.preventDefault();

            if(dragIndex === null) return;

            if(dragIndex !== index) 
            {
                  onReorder(dragIndex, index);
            }

            setDragIndex(null);
      };

    return { 
        onDragLeaveDeactivate,
        onDragOverActivate,

        onDragOver, 
        onDragStart,
        onDragEnd,

        onDropFiles,
        onDrop
    }
}