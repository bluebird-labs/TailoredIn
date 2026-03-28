------------------------------------------------------------------------------------------------------------------------
-- DROP FUNCTION score_job_salary;
CREATE FUNCTION score_job_salary(in_job_id uuid,
                                 in_job_salary_low INT,
                                 in_job_salary_high INT,
                                 in_target_salary INT)
    RETURNS TABLE
            (
                job_id         UUID,
                salary_score   INT,
                average_salary INT,
                target_salary  INT
            )
AS
$$
DECLARE
    out_average_salary DECIMAL;
    out_salary_score   DECIMAL;
BEGIN

    out_average_salary := CASE
                              WHEN in_job_salary_low IS NULL AND in_job_salary_high IS NULL THEN NULL
                              WHEN in_job_salary_high IS NULL THEN in_job_salary_low::DECIMAL
                              WHEN in_job_salary_low IS NULL THEN in_job_salary_high::DECIMAL
                              ELSE (in_job_salary_low + in_job_salary_high)::DECIMAL / 2.0
        END;

    out_salary_score := CASE
                            WHEN out_average_salary IS NULL THEN NULL
                            ELSE ((out_average_salary / in_target_salary) * 100.0)
        END;

    RETURN QUERY (SELECT in_job_id               AS job_id,
                         out_salary_score::INT   AS salary_score,
                         out_average_salary::INT AS average_salary,
                         in_target_salary        AS target_salary);
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------------------------------------------------------------------
-- DROP FUNCTION match_job_skills;
CREATE FUNCTION match_job_skills(in_job_id UUID, in_job_description_fts TSVECTOR)
    RETURNS TABLE
            (
                job_id          UUID,
                expert_skills   UUID[],
                interest_skills UUID[],
                avoid_skills    UUID[]
            )
AS
$$
BEGIN
    RETURN QUERY (WITH skill_keywords AS (SELECT s.id                                 AS skill_id,
                                                 s.affinity                           AS affinity,
                                                 UNNEST(s.variants || ARRAY [s.name]) AS variant
                                          FROM skills s),

                       job_skill_matches AS (SELECT DISTINCT ON (in_job_id, sk.skill_id) in_job_id   AS job_id,
                                                                                         sk.skill_id AS skill_id,
                                                                                         sk.affinity AS affinity
                                             FROM skill_keywords sk
                                             WHERE in_job_description_fts @@ PLAINTO_TSQUERY('english', sk.variant))

                  SELECT jsm.job_id                 AS job_id,
                         COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'expert'),
                                  ARRAY []::uuid[]) AS expert_skills,
                         COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'interest'),
                                  ARRAY []::uuid[]) AS interest_skills,
                         COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'avoid'),
                                  ARRAY []::uuid[]) AS avoid_skills
                  FROM job_skill_matches jsm
                  GROUP BY jsm.job_id);
END
$$ LANGUAGE plpgsql;

------------------------------------------------------------------------------------------------------------------------
-- DROP FUNCTION score_job_skills;
CREATE FUNCTION score_job_skills(in_job_id uuid,
                                            in_job_description_fts tsvector,
                                            in_expert_weight INT DEFAULT 8,
                                            in_interest_weight INT DEFAULT 2,
                                            in_avoid_weight INT DEFAULT 2)
    RETURNS TABLE
            (
                job_id            uuid,
                expert_score      INT,
                interest_score    INT,
                avoid_score       INT,
                total_skill_score INT,
                expert_skills     UUID[],
                interest_skills   UUID[],
                avoid_skills      UUID[]
            )
AS
$$
DECLARE
    total_weights INT := in_expert_weight + in_interest_weight + in_avoid_weight;
BEGIN
    RETURN QUERY (WITH skill_counts AS (SELECT s.affinity AS affinity, COUNT(*) AS cnt
                                        FROM skills s
                                        GROUP BY s.affinity),
                       job_skill_scores AS (SELECT jsm.*,
                                                   ((CARDINALITY(jsm.expert_skills)::DECIMAL /
                                                     (SELECT cnt FROM skill_counts WHERE affinity = 'expert')) *
                                                    100) AS expert_score,
                                                   ((CARDINALITY(jsm.interest_skills)::DECIMAL /
                                                     (SELECT cnt FROM skill_counts WHERE affinity = 'interest')) *
                                                    100) AS interest_score,
                                                   ((CARDINALITY(jsm.avoid_skills)::DECIMAL /
                                                     (SELECT cnt FROM skill_counts WHERE affinity = 'avoid')) *
                                                    100) AS avoid_score
                                            FROM match_job_skills(in_job_id, in_job_description_fts) jsm)
                  SELECT jsc.job_id                            AS job_id,
                         jsc.expert_score::INT                 AS expert_score,
                         jsc.interest_score::INT               AS interest_score,
                         jsc.avoid_score::INT                  AS avoid_score,
                         ((
                              in_expert_weight * jsc.expert_score +
                              in_interest_weight * jsc.interest_score -
                              in_avoid_weight * jsc.avoid_score
                              )::DECIMAL / total_weights)::INT AS total_skill_score,
                         jsc.expert_skills                     AS expert_skills,
                         jsc.interest_skills                   AS interest_skills,
                         jsc.avoid_skills                      AS avoid_skills
                  FROM job_skill_scores jsc);
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------------------------------------------------------------------
