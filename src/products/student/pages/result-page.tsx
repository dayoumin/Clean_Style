import type { Metadata } from 'next';
import { studentProduct } from '@/products/student';
import StudentResultClient from './StudentResultClient';

export function generateMetadata(): Metadata {
  return {
    title: studentProduct.copy.title,
    description: studentProduct.copy.primaryDiagnosticDescription,
  };
}

export default function StudentResultPage() {
  return <StudentResultClient />;
}
