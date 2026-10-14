import { notFound } from 'next/navigation';
import HomeConceptsClient from './HomeConceptsClient';

// 디자인 검토용 시안 페이지. 운영과 학생용 빌드에서는 열리지 않는다.
export default function HomeConceptsPage() {
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_APP_VARIANT === 'student') {
    notFound();
  }

  return <HomeConceptsClient />;
}
