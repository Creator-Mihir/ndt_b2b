import { Suspense } from 'react';
import ProductCatalog from './ProductCatalog';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-24 min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <ProductCatalog />
    </Suspense>
  );
}
