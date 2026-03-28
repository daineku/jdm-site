-- Migration v3: accessories shown globally by default
-- Add hidden_for_car_ids to track which models have this accessory hidden
alter table accessories add column if not exists hidden_for_car_ids uuid[] default '{}';

-- Index for performance
create index if not exists accessories_hidden_car_idx on accessories using gin(hidden_for_car_ids);

select 'Migration v3 complete' as status;
