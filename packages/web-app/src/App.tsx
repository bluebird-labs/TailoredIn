import React, { useEffect, useState } from 'react';
import './App.css';
import { Job, JobStatus }             from './model';
import { JobsDataGrid }               from './JobsDataGrid';
import { JobDetailsContainer } from './JobDetailsContainer';
import { Api }                 from './api/Api';

function App() {
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [currentJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobsList = () => {
    Api.fetchJobs(10, 0)
      .then(res => {
        setJobsList(res.data);
        setSelectedJob(res.data[0]);
      }).catch(err => alert(err));
  };

  useEffect(() => {
    fetchJobsList();
  }, []);

  const handleJobStatusChange = (job: Job, newStatus: JobStatus) => {
    Api.setJobStatus(job.id, newStatus).then(() => {
      console.info(`Job ${job.id} status changed to ${newStatus}`);

      let updatedJob = { ...job, status: newStatus };
      let isLast = false;
      let nextJobRow: Job | null = null;

      setJobsList([...jobsList.map((jobRow, i) => {
        if (jobRow.id === job.id) {
          isLast = i === jobsList.length - 1;
          nextJobRow = isLast ? null : jobsList[i + 1];
          return updatedJob;
        }
        return jobRow;
      })]);

      if (nextJobRow) setSelectedJob(nextJobRow);
      else setSelectedJob(updatedJob);

      if (isLast) fetchJobsList();
    }).catch(err => alert(err));
  };

  return (
    <div>
      <div id="main-container">
        <JobsDataGrid
          jobsList={jobsList}
          onSelectedJobChanged={setSelectedJob}
        />
        <JobDetailsContainer job={currentJob} onJobStatusChange={handleJobStatusChange} />
      </div>
    </div>
  );
}

export default App;
