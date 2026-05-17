from django.db import migrations, models


def set_roles_from_staff(apps, schema_editor):
    UserProfile = apps.get_model('accounts', 'UserProfile')
    for profile in UserProfile.objects.select_related('user').all():
        if profile.user.is_superuser or profile.user.is_staff:
            profile.role = 'admin' if profile.user.is_superuser else 'staff'
            profile.save(update_fields=['role'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_userprofile'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[('admin', 'Administrator'), ('staff', 'Staff'), ('user', 'User')],
                default='user',
                max_length=10,
            ),
        ),
        migrations.RunPython(set_roles_from_staff, migrations.RunPython.noop),
    ]
