# Form / File Upload
# Use a file #upload component to allow users to upload files.
# #form #file_upload
# ---
from h2o_wave import main, app, Q, ui


@app('/demo')
async def serve(q: Q):
    if 'file_upload' in q.args or 'file_upload_compact' in q.args:
        q.page['example'] = ui.form_card(box='1 1 4 10', items=[
            ui.text(f'file_upload={q.args.file_upload}'),
            ui.text(f'file_upload_compact={q.args.file_upload_compact}'),
            ui.button(name='show_upload', label='Back', primary=True),
        ])
    else:
        q.page['example'] = ui.form_card(
            box='1 1 4 10',
            items=[
                ui.file_upload(name='file_upload', label='Upload!', multiple=True,
                               file_extensions=['csv', 'gz'], max_file_size=10, max_size=15),
                ui.file_upload(name='file_upload_compact', label='Upload!', compact=True,
                               multiple=True, file_extensions=['jpg', 'png'], max_file_size=1, max_size=15),
                ui.button(name='submit', label='Submit')
            ]
        )
    await q.page.save()
