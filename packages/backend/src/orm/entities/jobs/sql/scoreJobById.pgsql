/* @name ScoreJobById */
SELECT j.id                 AS job_id,
       sk.expert_score      AS expert_score,
       sk.interest_score    AS interest_score,
       sk.avoid_score       AS avoid_score,
       sk.total_skill_score AS total_skill_score,
       sal.salary_score     AS salary_score,
       sk.expert_skills     AS expert_skills,
       sk.interest_skills   AS interest_skills,
       sk.avoid_skills      AS avoid_skills,
       sal.average_salary   AS average_salary,
       sal.target_salary    AS target_salary
FROM jobs j
         JOIN LATERAL score_job_skills(j.id,
                                       j.description_fts,
                                       :expertWeight::INT,
                                       :interestWeight::INT,
                                       :avoidWeight::INT) sk ON TRUE
         JOIN LATERAL score_job_salary(j.id,
                                       j.salary_low,
                                       j.salary_high,
                                       :targetSalary::INT) sal ON TRUE
WHERE j.id = :jobId;
