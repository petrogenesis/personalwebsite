from PIL import Image
import os

# ---------------- CONFIG ----------------
INPUT_FOLDER = "images/mineral-museum-images"
OUTPUT_FOLDER = "images/mineral-museum-images-thumbnails"

MAX_SIZE = (400, 400)  # adjust this (e.g. 300x300 for smaller cards)
QUALITY = 85  # JPEG compression quality

# ---------------------------------------

def process_image(input_path, output_path):
    try:
        with Image.open(input_path) as img:
            img = img.convert("RGB")  # ensures compatibility for JPG output

            # Create thumbnail (keeps aspect ratio)
            img.thumbnail(MAX_SIZE)

            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            img.save(output_path, "JPEG", quality=QUALITY, optimize=True)
            print(f"Saved: {output_path}")

    except Exception as e:
        print(f"Failed: {input_path} -> {e}")


def walk_and_resize():
    for root, _, files in os.walk(INPUT_FOLDER):
        for file in files:
            if file.lower().endswith((".jpg", ".jpeg", ".png")):
                input_path = os.path.join(root, file)

                # Preserve folder structure in output
                relative_path = os.path.relpath(input_path, INPUT_FOLDER)
                output_path = os.path.join(OUTPUT_FOLDER, relative_path)

                # Force .jpg output for consistency
                output_path = os.path.splitext(output_path)[0] + ".jpg"

                process_image(input_path, output_path)


if __name__ == "__main__":
    walk_and_resize()