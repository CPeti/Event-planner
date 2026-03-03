"""rename_is_available_to_status

Revision ID: 98ab3697daa8
Revises: 72d66e31cbc7
Create Date: 2026-03-03 13:22:24.597021

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '98ab3697daa8'
down_revision: Union[str, None] = '72d66e31cbc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new status column
    op.add_column('availabilities', sa.Column('status', sa.String(10), nullable=True))

    # Migrate data: true -> 'yes', false -> 'no'
    op.execute("UPDATE availabilities SET status = CASE WHEN is_available = true THEN 'yes' ELSE 'no' END")

    # Make status NOT NULL with default
    op.alter_column('availabilities', 'status', nullable=False, server_default='yes')

    # Drop old column
    op.drop_column('availabilities', 'is_available')


def downgrade() -> None:
    # Add back is_available column
    op.add_column('availabilities', sa.Column('is_available', sa.Boolean(), nullable=True))

    # Migrate data back: 'yes' -> true, anything else -> false
    op.execute("UPDATE availabilities SET is_available = CASE WHEN status = 'yes' THEN true ELSE false END")

    # Make is_available NOT NULL with default
    op.alter_column('availabilities', 'is_available', nullable=False, server_default='true')

    # Drop status column
    op.drop_column('availabilities', 'status')

