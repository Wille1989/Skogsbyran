export function calculateImageIndex(
      currentIndex: number, 
      step: number, 
      total: number
) {
      if (total <= 0) {
            return 0;
      }

      return (currentIndex + step + total) % total;
}