import { Job, JobDescriptionItemRole, JobStatus } from './model';
import { Button, ButtonGroup, Chip }              from '@mui/material';
import React, { useEffect, useRef, useState }     from 'react';
import { HighlightedText } from './HighlightedText';
import { Api }             from './api/Api';

export type JobDetailsContainerProps = {
  job: Job | null;
  onJobStatusChange: (job: Job, newStatus: JobStatus) => void;
};

type JobDetailsProps = {
  job: Job;
  onJobStatusChange: (job: Job, newStatus: JobStatus) => void;
}

type JobDetailsDescriptionTitleProps = {
  title: string;
};

type JobDetailsDescriptionTextProps = {
  text: string;
};

type JobDetailsActionsProps = {
  job: Job;
  onJobStatusChange: (job: Job, newStatus: JobStatus) => void;
}

type JobExtractedDataDetailsProps = {
  job: Job;
};

const highlightKeywords: string[] = [
  'node',
  'nodejs',
  'node.js',
  'sql',
  'typescript',
  'mongo',
  'mongodb',
  'javascript',
  'express',
  'backend',
  'rest',
  'aws',
  'postgres',
  'postgresql',
  'mysql',
  'devops',
  'infrastructure',
  'kafka',
  'kubernetes',
  'redis',
  'api',
  'jira',
  'jenkins',
  'pipeline',
  'pipelines',
  'agile',
  'scrum',
  'kanban',
  'graphql',
  'k8',
  'k8s',
  'c#',
  'java',
  'rust',
  'kotlin'
];

const lowlightKeywords: string[] = [
  'frontend',
  'ui',
  'react',
  'fullstack',
  'python',
  'php',
  'ruby',
  'rails'
];

const makeDescription = (job: Job): React.JSX.Element[] => {
  let key = 1;

  const elements: React.JSX.Element[] = [
    <Chip label={job.id} />,
    <Chip label={job.location_raw} />,
    <Chip label={job.title} />,
    <Chip label={'@' + job.company.name} />
  ];

  for (const item of job.description_items) {
    switch (item.role) {
      case JobDescriptionItemRole.BR:
        continue;
      case JobDescriptionItemRole.TITLE:
        elements.push(<DescriptionTitle title={item.text} key={key++} />);
        break;
      case JobDescriptionItemRole.TEXT:
        elements.push(<DescriptionText text={item.text} key={key++} />);
        break;
      case JobDescriptionItemRole.LIST:
        elements.push(<ul>{item.text.map(text => {
          return <li><DescriptionText text={text} key={key++} /></li>;
        })}</ul>);
        break;
      default:
        throw new Error(`Unknown description item role`);
    }
  }

  return elements;
};


const DescriptionTitle = (props: JobDetailsDescriptionTitleProps) => {
  return <strong><HighlightedText text={props.title} highlight={[]}
                                  lowlight={[]} /></strong>;
};

const DescriptionText = (props: JobDetailsDescriptionTextProps) => {
  return <HighlightedText text={props.text} highlight={highlightKeywords} lowlight={lowlightKeywords} />;
};


const JobDetailsActions = (props: JobDetailsActionsProps) => {
  const canApply = props.job.status === 'NEW';

  const handleChange = (newStatus: JobStatus) => {
    return () => props.onJobStatusChange(props.job, newStatus);
  };

  const generateResume = () => {
    Api.generateResume(props.job.id).then(({data}) => {
      console.info(`PDF stored at ${data.pdf_path}`);
    }).catch(err => alert(err));
  };

  if (canApply) {
    return <div id="job-details-actions-container">
      <ButtonGroup>
        <Button disabled={true} variant={'contained'}
                style={{ color: '#0693E3', fontWeight: 'bold' }}>{props.job.remote?.toUpperCase()}</Button>
        {
          props.job.salary_raw === null ?
            null :
            <Button disabled={true} variant={'contained'}
                    style={{ color: '#0693E3', fontWeight: 'bold' }}>{props.job.salary_raw}</Button>
        }

        <Button size="large" variant={'outlined'} color="primary" onClick={generateResume}>Resume</Button>
        <Button size="large" variant="contained" color="primary" href={props.job.linkedin_link}
                target="_blank">Apply</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button size="large" variant="contained" color="success"
                onClick={handleChange(JobStatus.APPLIED)}>Applied</Button>
        <Button size="large" variant="contained" color="secondary"
                onClick={handleChange(JobStatus.UNFIT)}>Unfit</Button>
        <Button size="large" variant="contained" color="warning"
                onClick={handleChange(JobStatus.LOW_SALARY)}>Low
          Salary</Button>
        <Button size="large" variant="contained" color="error"
                onClick={handleChange(JobStatus.EXPIRED)}>Expired</Button>
      </ButtonGroup>
    </div>;
  }

  return <div id="job-details-actions-container">
    <Chip color={props.job.status === JobStatus.APPLIED ? 'success' : 'warning'} label={props.job.status}
          style={{ width: '100%' }} />
  </div>;
};

const EmptyJobDetails = () => <strong>No job selected</strong>;

const JobDetails = (props: JobDetailsProps) => {
  const descriptionParts = makeDescription(props.job);
  const descriptionScrollRef = useRef(null);

  useEffect(() => {
    if (descriptionScrollRef.current !== null) {
      (descriptionScrollRef.current as any).scrollTop = 0;
    }
  }, [props.job]);

  return <div>
    <JobDetailsActions job={props.job} onJobStatusChange={props.onJobStatusChange} />
    <div id="job-details-description-container" ref={descriptionScrollRef}>{descriptionParts}</div>
  </div>;
};


export const JobDetailsContainer = (props: JobDetailsContainerProps) => {
  return <div id="job-details-container">
    <div>{props.job === null ? <EmptyJobDetails /> :
      <JobDetails job={props.job} onJobStatusChange={props.onJobStatusChange} />}</div>
  </div>;
};
