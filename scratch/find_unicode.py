import os

def check_chars(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    for i, char in enumerate(content):
                        if ord(char) > 127:
                            print(f"{path}:{content.count('\n', 0, i)+1}: {char} (U+{ord(char):04X})")

check_chars('components/simulations/circular-motion/')
