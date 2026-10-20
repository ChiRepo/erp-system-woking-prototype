import { timetableService, computeLectureLiveState, SEMESTER_TIMETABLE } from './src/services/timetableService.js';
export async function runTimetableChecks(check) {
 const at=(h,m=0,s=0)=>new Date(2026,9,12,h,m,s); // Monday, local clock, independent of run time.
 const first=SEMESTER_TIMETABLE.find(l=>l.day==='Monday'&&l.slotId==='S1');
 check('A morning lecture is upcoming before its actual start, with no automatic showcase', computeLectureLiveState(first,at(8,59)).status==='UPCOMING' && computeLectureLiveState(first,at(8,59)).startsInMinutes===1);
 check('A lecture becomes live exactly at its scheduled start', computeLectureLiveState(first,at(9)).isLive && computeLectureLiveState(first,at(9)).elapsedMinutes===0);
 check('A lecture remains live immediately before its scheduled end', computeLectureLiveState(first,at(10,14,59)).isLive);
 check('A lecture is completed at the end-exclusive boundary', computeLectureLiveState(first,at(10,15)).isCompleted && !computeLectureLiveState(first,at(10,15)).isLive);
 check('A finished lecture cannot become live again after college hours', computeLectureLiveState(first,at(18,40)).isCompleted && !computeLectureLiveState(first,at(18,40)).isLive);
 check('A finished lecture cannot become live again before midnight', computeLectureLiveState(first,at(23,59)).isCompleted);
 check('A genuinely scheduled early class remains live before09:00', computeLectureLiveState({...first,slotId:'EARLY',start:'08:00',end:'08:45'},at(8,15)).isLive);
 check('A genuinely scheduled evening class remains live after17:00', computeLectureLiveState({...first,slotId:'EVENING',start:'18:00',end:'19:00'},at(18,30)).isLive);
 check('A different day never borrows the current day live state', computeLectureLiveState({...first,day:'Tuesday'},at(9,30)).status==='OTHER_DAY');
 const student=timetableService.getStudentActiveOrNextLecture('CSE','Sem V',at(18,40));
 check('A finished student schedule returns no active or upcoming lecture', student.lecture===null && student.activeLecture===null && student.nextUpcomingLecture===null && !student.isLive && !student.isUpcoming);
 const missing=timetableService.getStudentActiveOrNextLecture('NO-ENROLLMENT','Sem I',at(9,30));
 check('A missing student cohort cannot borrow another department lecture', missing.lecture===null && missing.activeLecture===null && missing.todayLectures.length===0);
 const faculty=timetableService.getFacultyOngoingLecture(first.facultyId,at(18,40));
 check('A finished faculty schedule returns no current or next lecture', faculty.ongoingLecture===null && !faculty.isLiveNow && !faculty.isNextUpcoming);
 const unassigned=timetableService.getFacultyOngoingLecture('FAC-UNASSIGNED',at(9,30));
 check('An unassigned faculty cannot borrow a campus lecture', unassigned.ongoingLecture===null && unassigned.allFacultyLecturesToday.length===0);
 const gap=timetableService.getAllCampusOngoingLectures(at(12));
 check('The campus monitor remains empty during a real schedule gap', gap.liveLectures.length===0);
 const closed=timetableService.getAllCampusOngoingLectures(at(18,40));
 check('The campus monitor never fabricates live rows after all classes finish', closed.liveLectures.length===0 && closed.upcomingLectures.length===0);
 const live=timetableService.getAllCampusOngoingLectures(at(9,30));
 check('The campus monitor retains actual live lectures and accurate elapsed time', live.liveLectures.some(l=>l.id===first.id && l.elapsedMinutes===30));
 const early=timetableService.getStudentActiveOrNextLecture('CSE','Sem V',at(8,30));
 check('The student resolver returns the actual earliest upcoming lecture before its start', early.activeLecture===null && early.nextUpcomingLecture?.id===first.id && early.nextUpcomingLecture.startsInMinutes===30);
}
