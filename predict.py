import subprocess
import sys

import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import load_model

arg1 = sys.argv[1]
node_command = ['node', 'script.js', arg1]
subprocess.run(node_command)

# Prediction
# Load CSV file with last 20 rounds
df_last_20_rounds = pd.read_csv('last.csv')

# Use only the 'bust' column
bust_values = df_last_20_rounds[['bust']]

# Normalize 'bust' values
scaler = MinMaxScaler(feature_range=(0, 1))
bust_values_scaled = scaler.fit_transform(bust_values)

# Ensure we have exactly 20 values for prediction
if len(bust_values_scaled) != 20:
    raise ValueError("The CSV file must contain exactly 20 rows.")

# Load the saved model
model = load_model('model.h5')

# Prepare the data for prediction
X_pred = np.array([bust_values_scaled])

# Make predictions
predicted_bust_scaled = model.predict(X_pred)

# Inverse transform the predicted values to the original range
predicted_bust = scaler.inverse_transform(predicted_bust_scaled)
predicted_bust = np.clip(predicted_bust, 1, 999)  # Ensure values are within the expected range

print("Next bust prediction:", predicted_bust)

