import h2o
from h2o_wave import site, data, ui, build_model, get_model
import datatable as dt

page = site['/predictions']

target = 'Fuel_Price'
train_set = '/Users/geomodular/Datasets/walmart_train.csv'
test_set = '/Users/geomodular/Datasets/walmart_test.csv'

model = build_model(train_set, target=target)
prediction_set = model.predict(test_set, output_folder='/Users/geomodular')

df_train = dt.fread(train_set)
df_test = dt.fread(test_set)
df_predictions = dt.fread(prediction_set)

n_train = 50
n_test = 10
n_total = n_train + n_test
v = page.add('example', ui.plot_card(
    box='1 1 4 5',
    title='Line',
    data=data('date price', n_total),
    plot=ui.plot([ui.mark(type='line', x_scale='time', x='=date', y='=price', y_min=0)])
))

# We are taking the last `n_train` values from the train set.
values_train = [(df_train[-i, 'Date'], df_train[-i, 'Fuel_Price']) for i in reversed(range(1, n_train + 1))]
values_test = [(df_test[i, 'Date'], df_predictions[i, 0]) for i in range(n_test)]

v.data = values_train + values_test

page.save()
