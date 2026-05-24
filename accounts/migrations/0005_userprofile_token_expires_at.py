# Generated migration for adding token_expires_at field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_userprofile_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='token_expires_at',
            field=models.DateTimeField(null=True, blank=True),
        ),
    ]
