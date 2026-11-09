import { Navigate, useParams } from 'react-router';
import { useCourse } from '../api/queries';
import { AppFrame } from '../components/Nav';
import { StatusBlock } from '../components/StatusBlock';
import Article from './Article';
import Practice from './Practice';
import Quiz from './Quiz';

// Route /courses/:slug/lessons/:index → pilih layar sesuai tipe lesson.
// Quiz & Practice punya header sendiri (tanpa nav), Article pakai nav biasa.
export default function Lesson() {
  const { slug, index } = useParams();
  const courseQ = useCourse(slug);

  if (courseQ.isPending)
    return (
      <AppFrame>
        <StatusBlock kind="loading" layout="detail" />
      </AppFrame>
    );
  if (courseQ.isError) {
    const nf = courseQ.error?.status === 404 || courseQ.error?.status === 400;
    return (
      <AppFrame>
        <title>{nf ? 'Course not found · SkillLearn' : 'SkillLearn'}</title>
        <StatusBlock
          kind={nf ? 'notfound' : 'error'}
          nfTitle="Course not found"
          layout="detail"
          error={courseQ.error}
          onRetry={() => courseQ.refetch()}
          retrying={courseQ.isFetching}
        />
      </AppFrame>
    );
  }

  const course = courseQ.data;
  const i = /^\d+$/.test(index || '') ? Number(index) : -1;
  const lesson = course.lessons?.[i];
  if (!lesson)
    return (
      <AppFrame>
        <title>Lesson not found · SkillLearn</title>
        <StatusBlock kind="notfound" nfTitle="Lesson not found" />
      </AppFrame>
    );

  // Video diputar di halaman detail course
  if (lesson.type === 'Video') return <Navigate to={`/courses/${course.slug}?lesson=${lesson.index}`} replace />;
  if (lesson.type === 'Quiz') return <Quiz key={lesson.id} course={course} lesson={lesson} />;
  if (lesson.type === 'Practice') return <Practice key={lesson.id} course={course} lesson={lesson} />;
  return (
    <AppFrame>
      <Article key={lesson.id} course={course} lesson={lesson} />
    </AppFrame>
  );
}
