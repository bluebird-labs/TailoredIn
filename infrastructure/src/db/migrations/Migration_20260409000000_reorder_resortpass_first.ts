import { Migration } from '@mikro-orm/migrations';

export class Migration_20260409000000_reorder_resortpass_first extends Migration {
  override async up(): Promise<void> {
    // Move ResortPass to the front of experienceSelections in every archetype's content_selection.
    // ResortPass is identified by company_name = 'ResortPass' in the experiences table.
    this.addSql(`
      DO $$
      DECLARE
        v_resortpass_id uuid;
        v_archetype RECORD;
        v_selections jsonb;
        v_rp_entry   jsonb;
        v_rest        jsonb;
      BEGIN
        SELECT id INTO v_resortpass_id FROM experiences WHERE company_name = 'ResortPass' LIMIT 1;

        IF v_resortpass_id IS NULL THEN
          RAISE NOTICE 'ResortPass experience not found, skipping.';
          RETURN;
        END IF;

        FOR v_archetype IN SELECT id, content_selection FROM archetypes LOOP
          v_selections := v_archetype.content_selection -> 'experienceSelections';

          -- Only reorder if ResortPass is present and not already first
          IF v_selections IS NULL OR jsonb_array_length(v_selections) = 0 THEN
            CONTINUE;
          END IF;

          IF (v_selections -> 0 ->> 'experienceId') = v_resortpass_id::text THEN
            CONTINUE; -- already first
          END IF;

          -- Extract the ResortPass entry
          SELECT elem INTO v_rp_entry
          FROM jsonb_array_elements(v_selections) elem
          WHERE elem ->> 'experienceId' = v_resortpass_id::text
          LIMIT 1;

          IF v_rp_entry IS NULL THEN
            CONTINUE; -- ResortPass not in this archetype
          END IF;

          -- Build new array: ResortPass first, then the rest
          SELECT jsonb_agg(elem ORDER BY ordinality) INTO v_rest
          FROM jsonb_array_elements(v_selections) WITH ORDINALITY AS t(elem, ordinality)
          WHERE elem ->> 'experienceId' != v_resortpass_id::text;

          UPDATE archetypes
          SET content_selection = jsonb_set(
            content_selection,
            '{experienceSelections}',
            jsonb_build_array(v_rp_entry) || COALESCE(v_rest, '[]'::jsonb)
          )
          WHERE id = v_archetype.id;

          RAISE NOTICE 'Moved ResortPass to front in archetype %', v_archetype.id;
        END LOOP;
      END $$;
    `);
  }

  override async down(): Promise<void> {
    // Ordering cannot be meaningfully reversed without knowing the original order.
  }
}
