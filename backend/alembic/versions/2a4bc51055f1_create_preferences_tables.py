"""create_preferences_tables

Revision ID: 2a4bc51055f1
Revises: 7b94f05b9a14
Create Date: 2026-05-25 11:42:58.751336

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2a4bc51055f1'
down_revision: Union[str, None] = '7b94f05b9a14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('filter_preferences',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('budget_min', sa.Integer(), nullable=False),
    sa.Column('budget_max', sa.Integer(), nullable=False),
    sa.Column('move_in_from', sa.Date(), nullable=False),
    sa.Column('move_in_to', sa.Date(), nullable=False),
    sa.Column('max_distance_km', sa.Integer(), nullable=False),
    sa.Column('neighborhoods', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
    sa.Column('cleanliness_min', sa.Integer(), nullable=False),
    sa.Column('social_level_min', sa.Integer(), nullable=False),
    sa.Column('smoking_ok', sa.Boolean(), nullable=False),
    sa.Column('languages', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
    sa.Column('religion_filter', sa.Text(), nullable=True),
    sa.Column('university_filter', sa.Text(), nullable=True),
    sa.Column('same_gender_only', sa.Boolean(), nullable=False),
    sa.Column('listing_types', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_table('lifestyle_preferences',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('profile_id', sa.UUID(), nullable=False),
    sa.Column('budget_min', sa.Integer(), nullable=False),
    sa.Column('budget_max', sa.Integer(), nullable=False),
    sa.Column('move_in_date', sa.Date(), nullable=False),
    sa.Column('move_in_flexibility', sa.Integer(), nullable=False),
    sa.Column('preferred_neighborhoods', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
    sa.Column('latitude', sa.Float(), nullable=True),
    sa.Column('longitude', sa.Float(), nullable=True),
    sa.Column('city_name', sa.Text(), nullable=True),
    sa.Column('cleanliness', sa.Integer(), nullable=False),
    sa.Column('social_level', sa.Integer(), nullable=False),
    sa.Column('guest_frequency', sa.Text(), nullable=False),
    sa.Column('smoking', sa.Text(), nullable=False),
    sa.Column('drinking', sa.Text(), nullable=False),
    sa.Column('languages', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
    sa.Column('religion', sa.Text(), nullable=True),
    sa.Column('same_gender_only', sa.Boolean(), nullable=False),
    sa.Column('lifestyle_tags', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
    sa.Column('pets', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
    sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('profile_id')
    )


def downgrade() -> None:
    op.drop_table('lifestyle_preferences')
    op.drop_table('filter_preferences')
