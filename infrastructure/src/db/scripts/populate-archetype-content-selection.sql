-- Populate content_selection for 3 archetypes: individual_contributor, hands_on_manager, high_level_manager
-- Resolves all IDs dynamically from the live DB.

DO $$
DECLARE
  -- Experience IDs (by company_name + title)
  v_lantern_id       uuid;
  v_brightflow_id    uuid;
  v_volvo0_id        uuid;
  v_volvo1_id        uuid;
  v_luxe_id          uuid;
  v_streamnation_id  uuid;
  v_planorama_id     uuid;
  v_luckycart_id     uuid;
  -- Education
  v_edu_bs_id        uuid;
  -- Aggregated skill IDs
  v_all_cat_ids      jsonb;
  v_all_item_ids     jsonb;
  -- Content selections per archetype
  v_ic_cs            jsonb;
  v_hom_cs           jsonb;
  v_hlm_cs           jsonb;
BEGIN
  -- ── Resolve experience IDs ───────────────────────────────────────────
  SELECT id INTO STRICT v_lantern_id      FROM experiences WHERE company_name = 'Stealth Startup' AND title = 'Staff Software Engineer';
  SELECT id INTO STRICT v_brightflow_id   FROM experiences WHERE company_name = 'Brightflow.ai'   AND title = 'Staff Software Engineer';
  SELECT id INTO STRICT v_volvo0_id       FROM experiences WHERE company_name = 'Volvo Cars'       AND title = 'Tech Lead Manager';
  SELECT id INTO STRICT v_volvo1_id       FROM experiences WHERE company_name = 'Volvo Cars'       AND title = 'Senior Software Engineer';
  SELECT id INTO STRICT v_luxe_id         FROM experiences WHERE company_name = 'Luxe'             AND title = 'Lead Software Engineer';
  SELECT id INTO STRICT v_streamnation_id FROM experiences WHERE company_name = 'StreamNation'     AND title = 'Software Engineer';
  SELECT id INTO STRICT v_planorama_id    FROM experiences WHERE company_name = 'Planorama'        AND title = 'Lead Software Engineer';
  SELECT id INTO STRICT v_luckycart_id    FROM experiences WHERE company_name = 'LuckyCart'        AND title = 'Software Engineer';

  -- ── Education (B.S. in Computer Science = index 0) ───────────────────
  SELECT id INTO STRICT v_edu_bs_id FROM educations WHERE degree_title = 'B.S. in Computer Science';

  -- ── All skill category IDs (ordered) ─────────────────────────────────
  SELECT jsonb_agg(id ORDER BY ordinal) INTO v_all_cat_ids FROM skill_categories;

  -- ── All skill item IDs (ordered by category then item ordinal) ───────
  SELECT jsonb_agg(si.id ORDER BY sc.ordinal, si.ordinal) INTO v_all_item_ids
  FROM skill_items si
  JOIN skill_categories sc ON si.skill_category_id = sc.id;

  -- ── individual_contributor (IC) ──────────────────────────────────────
  -- Positions: lantern:0, brightflow:0, volvo:1, luxe:0, streamnation:0, planorama:0, luckycart:0
  v_ic_cs := jsonb_build_object(
    'experienceSelections', jsonb_build_array(
      jsonb_build_object('experienceId', v_lantern_id,      'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_brightflow_id,   'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_volvo1_id,       'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_luxe_id,         'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_streamnation_id, 'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_planorama_id,    'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_luckycart_id,    'bulletVariantIds', '[]'::jsonb)
    ),
    'projectIds',       '[]'::jsonb,
    'educationIds',     jsonb_build_array(v_edu_bs_id),
    'skillCategoryIds', v_all_cat_ids,
    'skillItemIds',     v_all_item_ids
  );

  -- ── hands_on_manager ─────────────────────────────────────────────────
  -- Positions: lantern:0, brightflow:0, volvo:0, volvo:1, luxe:0, planorama:0
  v_hom_cs := jsonb_build_object(
    'experienceSelections', jsonb_build_array(
      jsonb_build_object('experienceId', v_lantern_id,    'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_brightflow_id, 'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_volvo0_id,     'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_volvo1_id,     'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_luxe_id,       'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_planorama_id,  'bulletVariantIds', '[]'::jsonb)
    ),
    'projectIds',       '[]'::jsonb,
    'educationIds',     jsonb_build_array(v_edu_bs_id),
    'skillCategoryIds', v_all_cat_ids,
    'skillItemIds',     v_all_item_ids
  );

  -- ── high_level_manager (VP / Director) ───────────────────────────────
  -- Positions: volvo:0, volvo:1, luxe:0, planorama:0
  v_hlm_cs := jsonb_build_object(
    'experienceSelections', jsonb_build_array(
      jsonb_build_object('experienceId', v_volvo0_id,    'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_volvo1_id,    'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_luxe_id,      'bulletVariantIds', '[]'::jsonb),
      jsonb_build_object('experienceId', v_planorama_id, 'bulletVariantIds', '[]'::jsonb)
    ),
    'projectIds',       '[]'::jsonb,
    'educationIds',     jsonb_build_array(v_edu_bs_id),
    'skillCategoryIds', v_all_cat_ids,
    'skillItemIds',     v_all_item_ids
  );

  -- ── Apply updates ────────────────────────────────────────────────────
  UPDATE archetypes SET content_selection = v_ic_cs  WHERE key = 'individual_contributor';
  UPDATE archetypes SET content_selection = v_hom_cs WHERE key = 'hands_on_manager';
  UPDATE archetypes SET content_selection = v_hlm_cs WHERE key = 'high_level_manager';

  RAISE NOTICE 'Updated 3 archetypes: individual_contributor, hands_on_manager, high_level_manager';
END $$;
