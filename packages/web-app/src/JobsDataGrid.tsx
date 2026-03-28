import { DataGrid, GridCallbackDetails, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import React, { useEffect, useState }                                       from 'react';
import { Job, JobStatus }                                                   from './model';
import { toRelativeDateString }                                             from './utils';
import {
  GridInputRowSelectionModel
}                                                                           from '@mui/x-data-grid/models/gridRowSelectionModel';

const getRowClassName = (row: Job): string => {
  switch (row.status) {
    case JobStatus.APPLIED:
      return 'row--applied';
    case JobStatus.NEW:
      return '';
    default:
      return 'row--not-applied';
  }
};

export type JobsDataGridProps = {
  jobsList: Job[];
  onSelectedJobChanged: (job: Job | null) => void;
};

export const JobsDataGrid = (props: JobsDataGridProps) => {
  const columns: GridColDef<Job>[] = [
    {
      field: 'companyLogo',
      headerName: '',
      renderCell: (params) => <img src={params.row.company.logo_url} />,
      width: 100
    },
    {
      field: 'title',
      headerName: 'Job Title',
      width: 350,
      renderCell: params => <a href={params.row.linkedin_link} style={{ fontWeight: 'bold' }}
                               target={'_blank'}>{params.row.title}</a>
    },
    {
      field: 'companyName', headerName: 'Company', width: 250,
      renderCell: params => <a href={params.row.company.linkedin_link} style={{ fontWeight: 'bold' }}
                               target={'_blank'}>{params.row.company.name}</a>
    },
    {
      field: 'posted_at',
      headerName: 'Posted',
      width: 200,
      valueGetter: (value: string, job) => toRelativeDateString(new Date(value)) + (job.is_repost ? ' (Reposted)' : '')
    },
    // {
    //   field: 'remote',
    //   headerName: 'Remote',
    //   cellClassName: params => getRemoteClassNames(params.row.remote),
    //   valueGetter: (value: string | null) => value === null ? 'Unknown' : pascalCase(value)
    // },
    { field: 'location_raw', headerName: 'Location', width: 250 },
    // {
    //   field: 'status',
    //   headerName: 'Status',
    //   renderCell: params => {
    //     return <JobStatusSelect
    //       job={params.row}
    //       onStatusChange={(job, newStatus) => {
    //       }}
    //     ></JobStatusSelect>;
    //   }
    // }
    // { field: 'salary_low', headerName: 'Low', valueGetter: formatSalary, cellClassName: 'salary' },
    // { field: 'salary_high', headerName: 'High', valueGetter: formatSalary, cellClassName: 'salary' }
  ];

  const [rowSelectionModel, setRowSelectionModel] = useState<GridInputRowSelectionModel>(
    props.jobsList.length > 0 ? [props.jobsList[0].id] : []
  );

  const onRowSelectionModelChange = (rowSelectionModel: GridRowSelectionModel, callbackDetails: GridCallbackDetails) => {
    const rowId = rowSelectionModel[0] ?? null;

    if (rowId !== null) {
      const job = callbackDetails.api.getRow(rowId) as Job;
      props.onSelectedJobChanged(job);
    } else {
      props.onSelectedJobChanged(null);
    }

    setRowSelectionModel(rowSelectionModel);
  };

  useEffect(() => {
    if (Array.isArray(rowSelectionModel) && rowSelectionModel.length === 0 && props.jobsList.length > 0) {
      const firstJob = props.jobsList[0];
      setRowSelectionModel([firstJob.id]);
      props.onSelectedJobChanged(firstJob);
    }
  }, [props.jobsList, rowSelectionModel]);

  return (
    <div id="jobs-data-grid">
      <DataGrid
        getRowId={model => model.id}
        getRowClassName={model => getRowClassName(model.row)}
        columns={columns}
        rows={props.jobsList}
        rowHeight={100}
        disableColumnSorting={true}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={onRowSelectionModelChange} />
    </div>
  );
};
