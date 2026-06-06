import json
import os
import re

JSON_FILE = "minerals.json"


def load_data():
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_data(data):
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_next_id(data, prefix="u"):
    max_num = 0

    for specimen in data:
        specimen_id = specimen.get("id", "")
        match = re.match(rf"{prefix}(\d+)", specimen_id)

        if match:
            max_num = max(max_num, int(match.group(1)))

    return f"{prefix}{max_num + 1}"


def create_specimen():
    data = load_data()

    specimen_id = get_next_id(data)

    print(f"\nCreating specimen {specimen_id}\n")

    name = input("Name: ")
    locality = input("Locality: ")
    dimensions = input("Dimensions: ")
    size = input("Size: ")
    weight = input("Weight: ")
    price = input("Price: ")
    system = input("Crystal System: ")
    self_collected = input("Self Collected (Yes/No): ")
    category = input("Category: ")
    subcategory = input("Subcategory: ")
    description = input("Description: ")

    mineral_folder = name.lower().replace(" ", "-")

    thumbnail = (
        f"images/mineral-museum-images/"
        f"{mineral_folder}/thumbnails/{specimen_id}-thumb.jpg"
    )

    image = input("Primary image path: ")

    extra_images = []

    while True:
        img = input("Additional image (blank to finish): ")

        if not img:
            break

        extra_images.append(img)

    specimen = {
        "id": specimen_id,
        "name": name,
        "locality": locality,
        "dimensions": dimensions,
        "size": size,
        "weight": weight,
        "price": price,
        "system": system,
        "selfCollected": self_collected,
        "category": category,
        "subcategory": subcategory,
        "thumbnail": thumbnail,
        "image": image,
        "images": extra_images,
        "description": description
    }

    data.append(specimen)
    save_data(data)

    print("\nSpecimen added successfully!")
    print(json.dumps(specimen, indent=2))


if __name__ == "__main__":
    create_specimen()
