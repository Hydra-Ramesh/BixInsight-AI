import sys
import json
import pandas as pd
import numpy as np

def transform_data(df, operation, col_name, value=None):
    """Apply the requested transformation to the DataFrame."""
    try:
        # We need to explicitly convert back to the appropriate type if it was parsed as string
        if operation == "drop_column":
            if col_name in df.columns:
                df = df.drop(columns=[col_name])
        
        elif operation == "fill_mean":
            if col_name in df.columns and pd.api.types.is_numeric_dtype(df[col_name]):
                mean_val = df[col_name].mean()
                df[col_name] = df[col_name].fillna(mean_val)
                
        elif operation == "fill_zero":
            if col_name in df.columns and pd.api.types.is_numeric_dtype(df[col_name]):
                df[col_name] = df[col_name].fillna(0)

        elif operation == "drop_na":
            if col_name in df.columns:
                df = df.dropna(subset=[col_name])

        return df

    except Exception as e:
        print(f"Transform error: {e}", file=sys.stderr)
        return df # Return original on failure

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        payload = json.loads(input_data)
        
        # Payload format:
        # { "data": [...], "operation": "fill_mean", "column": "Sales" }
        records = payload.get("data", [])
        operation = payload.get("operation")
        col_name = payload.get("column")
        
        if not records or not operation or not col_name:
            raise ValueError("Missing data, operation, or column")

        df = pd.DataFrame(records)
        df_clean = transform_data(df, operation, col_name)

        # Generate updated summary stats for the new DataFrame
        columns_info = []
        for col in df_clean.columns:
            dtype = str(df_clean[col].dtype)
            null_count = int(df_clean[col].isna().sum())
            unique_count = int(df_clean[col].nunique())
            
            # Simple typing
            if pd.api.types.is_numeric_dtype(df_clean[col]):
                col_type = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(df_clean[col]):
                col_type = "datetime"
            else:
                col_type = "categorical"
                
            sample = df_clean[col].dropna().head(3).tolist()

            columns_info.append({
                "name": col,
                "type": col_type,
                "dtype": dtype,
                "nullCount": null_count,
                "uniqueCount": unique_count,
                "sample": sample
            })

        # Replace invalid floats (NaN, Inf) with None for JSON serialization
        df_clean = df_clean.replace([np.inf, -np.inf, np.nan], None)
        
        result = {
            "status": "success",
            "columns": columns_info,
            "rowCount": len(df_clean),
            "columnCount": len(df_clean.columns),
            "sampleData": df_clean.head(100).to_dict(orient="records") # return updated sample
        }
        
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))
        sys.exit(1)
