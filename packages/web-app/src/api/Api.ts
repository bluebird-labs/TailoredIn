import { Job, JobStatus } from '../model';

export abstract class Api {
  public static async setJobStatus(jobId: string, newStatus: JobStatus) {
    return fetch(`http://localhost:8000/jobs/${jobId}/status`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus
      })
    });
  }

  public static async generateResume(jobId: string): Promise<{
    data: { pdf_path: string }
  }> {
    return fetch(`http://localhost:8000/jobs/${jobId}/generate-resume`, {
      method: 'PUT'
    }).then(res => res.json());
  }

  public static async fetchJobs(limit: number, offset: number): Promise<{ data: Job[] }> {
    return fetch(`http://localhost:8000/jobs/new?limit=${limit}&offset=${offset}`)
      .then((res) => res.json());
  }
}
