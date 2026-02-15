import android.content.Context
import android.os.Environment
import android.util.Log
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import org.tensorflow.lite.support.metadata.MetadataExtractor
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.nio.FloatBuffer
import java.nio.MappedByteBuffer
import java.nio.charset.StandardCharsets

class YAMNetClassifier(private val context: Context) {
    private var interpreter: Interpreter? = null
    private var labels: List<String> = emptyList()  // 메타데이터에서 추출한 라벨을 저장할 변수

    companion object {
        private const val MODEL_FILENAME = "yamnet.tflite"
        private const val SAMPLE_RATE = 16000
        private const val DURATION = 0.975f
        private const val SAMPLES_PER_SEGMENT = (SAMPLE_RATE * DURATION).toInt() // 15600 samples
        private const val NUM_CLASSES = 521

        private const val WINDOW_SIZE = 0.975f  // 윈도우 크기 (초)
        private const val OVERLAP_RATIO = 0.5f  // 50% 오버랩
        private const val SAMPLES_PER_WINDOW = (SAMPLE_RATE * WINDOW_SIZE).toInt() // 15600 samples
        private const val STRIDE =
            (SAMPLES_PER_WINDOW * (1 - OVERLAP_RATIO)).toInt() // 7800 samples

        // YAMNet의 기본 라벨 리스트 (이전과 동일하므로 생략)
        private val LABELS = listOf(
            "Speech",
            "Male speech, man speaking",
            "Female speech, woman speaking",
            "Child speech, kid speaking",
            "Conversation",
            "Narration, monologue",
            "Babbling",
            "Speech synthesizer",
            "Shout",
            "Bellow",
            "Whoop",
            "Yell",
            "Children shouting",
            "Screaming",
            "Whispering",
            "Laughter",
            "Baby laughter",
            "Giggle",
            "Snicker",
            "Belly laugh",
            "Chuckle, chortle",
            "Crying, sobbing",
            "Baby cry, infant cry",
            "Whimper",
            "Wail, moan",
            "Sigh",
            "Singing",
            "Choir",
            "Yodeling",
            "Chant",
            "Mantra",
            "Male singing",
            "Female singing",
            "Child singing",
            "Synthetic singing",
            "Rapping",
            "Humming",
            "Groan",
            "Grunt",
            "Whistling",
            "Breathing",
            "Wheeze",
            "Snoring",
            "Gasp",
            "Cough",
            "Throat clearing",
            "Sneeze",
            "Sniff",
            "Run",
            "Walk, footsteps",
            "Shuffle",
            "Chewing, mastication",
            "Biting",
            "Gargling",
            "Stomach rumble",
            "Burping, eructation",
            "Hiccup",
            "Fart",
            "Hands",
            "Finger snapping",
            "Clapping",
            "Heart sounds, heartbeat",
            "Heart murmur",
            "Cheering",
            "Applause",
            "Chatter",
            "Crowd",
            "Hubbub, speech noise, speech babble",
            "Children playing",
            "Animal",
            "Domestic animals, pets",
            "Dog",
            "Bark",
            "Yip",
            "Howl",
            "Bow-wow",
            "Growling",
            "Whimper (dog)",
            "Cat",
            "Purr",
            "Meow",
            "Hiss",
            "Caterwaul",
            "Livestock, farm animals, working animals",
            "Horse",
            "Clip-clop",
            "Neigh, whinny",
            "Cattle, bovinae",
            "Moo",
            "Cowbell",
            "Pig",
            "Oink",
            "Goat",
            "Bleat",
            "Sheep",
            "Fowl",
            "Chicken, rooster",
            "Cluck",
            "Crowing, cock-a-doodle-doo",
            "Turkey",
            "Gobble",
            "Duck",
            "Quack",
            "Goose",
            "Honk",
            "Wild animals",
            "Roaring cats (lions, tigers)",
            "Roar",
            "Bird",
            "Bird vocalization, bird call, bird song",
            "Chirp, tweet",
            "Squawk",
            "Pigeon, dove",
            "Coo",
            "Crow",
            "Caw",
            "Owl",
            "Hoot",
            "Bird flight, flapping wings",
            "Canidae, dogs, wolves",
            "Rodents, rats, mice",
            "Mouse",
            "Chipmunk",
            "Phasianidae, fowl",
            "Insect",
            "Cricket",
            "Mosquito",
            "Fly, housefly",
            "Bee, wasp, etc.",
            "Buzz",
            "Frog",
            "Croak",
            "Snake",
            "Rattle",
            "Whale vocalization",
            "Music",
            "Musical instrument",
            "Plucked string instrument",
            "Guitar",
            "Electric guitar",
            "Bass guitar",
            "Acoustic guitar",
            "Steel guitar, slide guitar",
            "Tapping (guitar technique)",
            "Strum",
            "Banjo",
            "Sitar",
            "Mandolin",
            "Zither",
            "Ukulele",
            "Keyboard (musical)",
            "Piano",
            "Electric piano",
            "Organ",
            "Electronic organ",
            "Hammond organ",
            "Synthesizer",
            "Sampler",
            "Harpsichord",
            "Percussion",
            "Drum kit",
            "Drum machine",
            "Drum",
            "Snare drum",
            "Rimshot",
            "Drum roll",
            "Bass drum",
            "Timpani",
            "Tabla",
            "Cymbal",
            "Hi-hat",
            "Wood block",
            "Tambourine",
            "Rattle (instrument)",
            "Maraca",
            "Gong",
            "Tubular bells",
            "Mallet percussion",
            "Marimba, xylophone",
            "Glockenspiel",
            "Vibraphone",
            "Steelpan",
            "Orchestra",
            "Brass instrument",
            "Trumpet",
            "Trombone",
            "Bowed string instrument",
            "String section",
            "Violin, fiddle",
            "Pizzicato",
            "Cello",
            "Double bass",
            "Wind instrument, woodwind instrument",
            "Flute",
            "Saxophone",
            "Clarinet",
            "Harp",
            "Bell",
            "Church bell",
            "Jingle bell",
            "Bicycle bell",
            "Tuning fork",
            "Chime",
            "Wind chime",
            "Change ringing (campanology)",
            "Harmonica",
            "Accordion",
            "Bagpipes",
            "Didgeridoo",
            "Shofar",
            "Theremin",
            "Singing bowl",
            "Scratching (performance technique)",
            "Pop music",
            "Hip hop music",
            "Beatboxing",
            "Rock music",
            "Heavy metal",
            "Punk rock",
            "Grunge",
            "Progressive rock",
            "Rock and roll",
            "Psychedelic rock",
            "Rhythm and blues",
            "Soul music",
            "Reggae",
            "Country",
            "Swing music",
            "Bluegrass",
            "Funk",
            "Folk music",
            "Middle Eastern music",
            "Jazz",
            "Disco",
            "Classical music",
            "Opera",
            "Electronic music",
            "House music",
            "Techno",
            "Dubstep",
            "Drum and bass",
            "Electronica",
            "Electronic dance music",
            "Ambient music",
            "Trance music",
            "Music of Latin America",
            "Salsa music",
            "Flamenco",
            "Blues",
            "Music for children",
            "New-age music",
            "Vocal music",
            "A capella",
            "Music of Africa",
            "Afrobeat",
            "Christian music",
            "Gospel music",
            "Music of Asia",
            "Carnatic music",
            "Music of Bollywood",
            "Ska",
            "Traditional music",
            "Independent music",
            "Song",
            "Background music",
            "Theme music",
            "Jingle (music)",
            "Game music",
            "Sound effect",
            "Explosion",
            "Gunshot, gunfire",
            "Machine gun",
            "Fusillade",
            "Artillery fire",
            "Cap gun",
            "Fireworks",
            "Firecracker",
            "Bang",
            "Booming",
            "Breaking",
            "Crushing",
            "Crumpling,",
            "crinkling",
            "Tearing",
            "Shattering",
            "Smash",
            "Thump, thud",
            "Boom",
            "Wood",
            "Splinter",
            "Crack",
            "Chop",
            "Squeak",
            "Creak",
            "Glass",
            "Chink, clink",
            "Shatter",
            "Liquid",
            "Splash, splatter",
            "Slosh",
            "Squish",
            "Drip",
            "Pour",
            "Trickle, dribble",
            "Gush",
            "Fill",
            "with water",
            "Spray",
            "Pump (liquid)",
            "Stir",
            "Boiling",
            "Sonar",
            "Arrow",
            "Whoosh, swoosh, swish",
            "Thunk",
            "Electronic tuner",
            "Effects unit",
            "Chorus effect",
            "Basketball bounce",
            "Bang",
            "Slap, smack",
            "Whack, thwack",
            "Smash, crash",
            "Breaking",
            "Bouncing",
            "Whip",
            "Flap",
            "Scratch",
            "Scrape",
            "Rub",
            "Roll",
            "Crushing",
            "Crumpling, crinkling",
            "Tearing",
            "Beep, bleep",
            "Ping",
            "Ding",
            "Clang",
            "Squeal",
            "Crunch",
            "Rustle",
            "Whir",
            "Clatter",
            "Clicking",
            "Clickety-clack",
            "Rumble",
            "Plop",
            "Jingle, tinkle",
            "Hum",
            "Zing",
            "Boing",
            "Crackle",
            "Hiss",
            "Sizzle",
            "Buzz",
            "Rattle",
            "Clock",
            "Tick",
            "Tick-tock",
            "Gong",
            "Ping",
            "Ding",
            "Clang",
            "Squeal",
            "Crunch",
            "Engine",
            "Light engine (high frequency)",
            "Dental drill, dentist's drill",
            "Drill",
            "Jet engine",
            "Motor vehicle (road)",
            "Vehicle",
            "Car",
            "Car passing by",
            "Race car, auto racing",
            "Truck",
            "Air brake",
            "Air horn, truck horn",
            "Reversing beeps",
            "Bus",
            "Emergency vehicle",
            "Police car (siren)",
            "Ambulance (siren)",
            "Fire engine, fire truck (siren)",
            "Motorcycle",
            "Traffic noise, roadway noise",
            "Rail transport",
            "Train",
            "Train whistle",
            "Train horn",
            "Railroad car, train wagon",
            "Train wheels squealing",
            "Subway, metro, underground",
            "Aircraft",
            "Aircraft engine",
            "Jet engine",
            "Propeller, airscrew",
            "Helicopter",
            "Fixed-wing aircraft, airplane",
            "Bicycle",
            "Skateboard",
            "Engine starting",
            "Engine",
            "Light engine (high frequency)",
            "Dental drill, dentist's drill",
            "Drill",
            "Jet engine",
            "Motor vehicle (road)",
            "Vehicle",
            "Car",
            "Car passing by",
            "Race car, auto racing",
            "Truck",
            "Air brake",
            "Air horn, truck horn",
            "Reversing beeps",
            "Bus",
            "Emergency vehicle",
            "Police car (siren)",
            "Ambulance (siren)",
            "Fire engine, fire truck (siren)",
            "Motorcycle",
            "Traffic noise, roadway noise",
            "Rail transport",
            "Train",
            "Train whistle",
            "Train horn",
            "Railroad car, train wagon",
            "Train wheels squealing",
            "Subway, metro, underground",
            "Aircraft",
            "Aircraft engine",
            "Jet engine",
            "Propeller, airscrew",
            "Helicopter",
            "Fixed-wing aircraft, airplane",
            "Bicycle",
            "Skateboard",
            "Engine starting",
            "Door",
            "Doorbell",
            "Ding-dong",
            "Sliding door",
            "Slam",
            "Knock",
            "Tap",
            "Squeak",
            "Cupboard open or close",
            "Drawer open or close",
            "Dishes, pots, and pans",
            "Cutlery, silverware",
            "Chopping (food)",
            "Frying (food)",
            "Microwave oven",
            "Water tap, faucet",
            "Sink (filling or washing)",
            "Bathtub (filling or washing)",
            "Hair dryer",
            "Toilet flush",
            "Toothbrush",
            "Electric toothbrush",
            "Vacuum cleaner",
            "Zipper (clothing)",
            "Keys jangling",
            "Coin (dropping)",
            "Scissors",
            "Electric shaver, electric razor",
            "Shuffling cards",
            "Typing",
            "Typewriter",
            "Computer keyboard",
            "Writing",
            "Alarm",
            "Telephone",
            "Telephone bell ringing",
            "Ringtone",
            "Phone dialing, DTMF",
            "Dial tone",
            "Busy signal",
            "Alarm clock",
            "Siren",
            "Civil defense siren",
            "Buzzer",
            "Smoke detector, smoke alarm",
            "Fire alarm",
            "Foghorn",
            "Whistle",
            "Steam whistle",
            "Mechanisms",
            "Ratchet, pawl",
            "Clock",
            "Tick",
            "Tick-tock",
            "Gears",
            "Pulleys",
            "Sewing machine",
            "Mechanical fan",
            "Air conditioning",
            "Cash register",
            "Printer",
            "Camera",
            "Single-lens reflex camera",
            "Tools",
            "Hammer",
            "Jackhammer",
            "Sawing",
            "Filing (rasp)",
            "Sanding",
            "Power tool",
            "Drill",
            "Explosion",
            "Gunshot, gunfire",
            "Machine gun",
            "Fusillade",
            "Artillery fire",
            "Cap gun",
            "Fireworks",
            "Firecracker",
            "Burst, pop",
            "Scratch",
            "Scrape",
            "Rub",
            "Roll",
            "Crushing",
            "Crumpling, crinkling",
            "Tearing",
            "Silence",
            "Quiet",
            "Ambient noise",
            "Background noise"
        )
    }

    class AudioBuffer {
        private val buffer = FloatArray(SAMPLES_PER_WINDOW)
        private var position = 0

        fun add(newData: FloatArray) {
            // 새로운 데이터가 들어올 공간이 충분한지 확인
            val remainingSpace = buffer.size - position
            val dataToAdd = minOf(remainingSpace, newData.size)

            // 새 데이터 추가
            System.arraycopy(newData, 0, buffer, position, dataToAdd)
            position += dataToAdd
        }

        fun isFull(): Boolean = position >= buffer.size

        fun getBuffer(): FloatArray = buffer.clone()

        fun slide() {
            // STRIDE만큼 데이터를 앞으로 이동
            System.arraycopy(buffer, STRIDE, buffer, 0, SAMPLES_PER_WINDOW - STRIDE)
            position = SAMPLES_PER_WINDOW - STRIDE
        }
    }

    init {
        setupInterpreter()
    }

    private fun setupInterpreter() {
        try {
            val tfliteModel: MappedByteBuffer = FileUtil.loadMappedFile(context, MODEL_FILENAME)

            // 메타데이터 추출기 생성
            val metadataExtractor = MetadataExtractor(tfliteModel)

            // 라벨 파일 읽기
            val labelsFileName = metadataExtractor.getAssociatedFileNames().find {
                it.contains("label") || it.contains("Label")
            }

            if (labelsFileName != null) {
                // InputStream을 사용하여 라벨 파일 읽기
                metadataExtractor.getAssociatedFile(labelsFileName).use { inputStream ->
                    BufferedReader(
                        InputStreamReader(
                            inputStream,
                            StandardCharsets.UTF_8
                        )
                    ).use { reader ->
                        labels = reader.readLines()
                            .map { it.trim() }
                            .filter { it.isNotEmpty() }

                        // 외부 저장소에 라벨 파일 저장
                        saveLabelsToFile()
                    }
                }

                Log.d("YAMNetClassifier", "Loaded ${labels.size} labels from metadata")
            } else {
                Log.e("YAMNetClassifier", "No label file found in metadata")
            }

            val options = Interpreter.Options()
            interpreter = Interpreter(tfliteModel, options)
        } catch (e: Exception) {
//            Log.e("YAMNetClassifier", "Error setting up classifier", e)
            throw RuntimeException("Error setting up classifier: ${e.message}")
        }
    }

    private fun saveLabelsToFile() {
        try {
            // 외부 저장소의 Download 디렉토리에 파일 저장
            val downloadDir =
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val file = File(downloadDir, "yamnet_labels.txt")

            file.bufferedWriter().use { writer ->
                labels.forEachIndexed { index, label ->
                    writer.write("$index: $label\n")
                }
            }

            Log.d("YAMNetClassifier", "Labels saved to: ${file.absolutePath}")
        } catch (e: Exception) {
//            Log.e("YAMNetClassifier", "Error saving labels to file", e)
        }
    }

    /**
     * 오디오 데이터를 전처리하고 분류합니다.
     * @param audioData 원본 오디오 데이터
     * @param originalSampleRate 입력 오디오의 샘플레이트
     * @param isstereo 스테레오 여부
     * @return 분류 결과 리스트 (세그먼트별 예측 결과)
     */
    fun classifyAudio(
        audioData: FloatArray,
        originalSampleRate: Int,
        isstereo: Boolean = false
    ): List<String> {
        try {
            // 1. 스테레오 -> 모노 변환
            val monoData = if (isstereo) {
                convertStereoToMono(audioData)
            } else {
                audioData
            }

            // 2. 샘플레이트 변환
            val resampledData = if (originalSampleRate != SAMPLE_RATE) {
                resample(monoData, originalSampleRate, SAMPLE_RATE)
            } else {
                monoData
            }

            // 3. 정규화 ([-1, 1] 범위로)
            val normalizedData = normalize(resampledData)

            // 4. 세그먼트로 분할
            val segments = splitIntoSegments(normalizedData)

            // 5. 각 세그먼트 분류
            return segments.mapNotNull { segment ->
                classifySegment(segment)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            return emptyList()
        }
    }

    private fun convertStereoToMono(stereoData: FloatArray): FloatArray {
        // 스테레오는 좌우 채널이 번갈아 나오므로 절반 크기의 배열 생성
        val monoData = FloatArray(stereoData.size / 2)

        // 좌우 채널의 평균을 계산
        for (i in monoData.indices) {
            monoData[i] = (stereoData[i * 2] + stereoData[i * 2 + 1]) / 2f
        }
        return monoData
    }

    private fun resample(
        data: FloatArray,
        originalRate: Int,
        targetRate: Int
    ): FloatArray {
        // 선형 보간법을 사용한 단순한 리샘플링
        val ratio = originalRate.toFloat() / targetRate
        val resampledLength = (data.size / ratio).toInt()
        val resampledData = FloatArray(resampledLength)

        for (i in resampledData.indices) {
            val originalIndex = (i * ratio).toInt()
            val nextIndex = minOf(originalIndex + 1, data.size - 1)
            val fraction = (i * ratio) - originalIndex

            // 선형 보간
            resampledData[i] = data[originalIndex] * (1 - fraction) +
                    data[nextIndex] * fraction
        }

        return resampledData
    }

    private fun normalize(data: FloatArray): FloatArray {
        // 최대 절대값 찾기
        val maxAbs = data.maxOf { abs(it) }

        // 0으로 나누는 것을 방지
        if (maxAbs == 0f) return data

        // [-1, 1] 범위로 정규화
        return FloatArray(data.size) { i -> data[i] / maxAbs }
    }

    private fun splitIntoSegments(data: FloatArray): List<FloatArray> {
        val segments = mutableListOf<FloatArray>()
        var startIdx = 0

        while (startIdx + SAMPLES_PER_SEGMENT <= data.size) {
            val segment = FloatArray(SAMPLES_PER_SEGMENT)
            System.arraycopy(data, startIdx, segment, 0, SAMPLES_PER_SEGMENT)
            segments.add(segment)
            startIdx += SAMPLES_PER_SEGMENT
        }

        // 마지막 세그먼트가 불완전한 경우 0으로 패딩
        if (startIdx < data.size) {
            val lastSegment = FloatArray(SAMPLES_PER_SEGMENT)
            val remainingSize = data.size - startIdx
            System.arraycopy(data, startIdx, lastSegment, 0, remainingSize)
            segments.add(lastSegment)
        }

        return segments
    }

    private fun classifySegment(segment: FloatArray): String? {
        return try {
            // 입력 버퍼 준비
            val inputBuffer = FloatBuffer.allocate(segment.size)
            inputBuffer.put(segment)
            inputBuffer.rewind()

            // 출력 버퍼 준비
            val outputBuffer = Array(1) { FloatArray(NUM_CLASSES) }

            // 추론 실행
            interpreter?.run(inputBuffer, outputBuffer)

            // 가장 높은 점수의 클래스 찾기
            val maxIndex = outputBuffer[0].indices.maxByOrNull { outputBuffer[0][it] } ?: 0

            // 예측된 클래스 이름 반환
//            LABELS.getOrNull(maxIndex)

            // 메타데이터에서 추출한 labels 사용
            labels.getOrNull(maxIndex)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun classifyAudioWithProbability(
        audioData: FloatArray,
        originalSampleRate: Int,
        isstereo: Boolean = false
    ): List<Pair<String, Float>> {
        try {
            val monoData = if (isstereo) {
                convertStereoToMono(audioData)
            } else {
                audioData
            }

            val resampledData = if (originalSampleRate != SAMPLE_RATE) {
                resample(monoData, originalSampleRate, SAMPLE_RATE)
            } else {
                monoData
            }

            val normalizedData = normalize(resampledData)
            val segments = splitIntoSegments(normalizedData)

            return segments.mapNotNull { segment ->
                classifySegmentWithProbability(segment)
            }.flatten()
        } catch (e: Exception) {
            e.printStackTrace()
            return emptyList()
        }
    }

    private fun classifySegmentWithProbability(segment: FloatArray): List<Pair<String, Float>>? {
        return try {
            val inputBuffer = FloatBuffer.allocate(segment.size)
            inputBuffer.put(segment)
            inputBuffer.rewind()

            val outputBuffer = Array(1) { FloatArray(NUM_CLASSES) }
            interpreter?.run(inputBuffer, outputBuffer)

            // 결과를 라벨과 확률의 페어 리스트로 변환
            outputBuffer[0].mapIndexed { index, probability ->
                labels.getOrNull(index)?.let { label ->
                    label to probability
                }
            }.filterNotNull()

        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun close() {
        interpreter?.close()
        interpreter = null
    }

    private fun abs(value: Float): Float = if (value < 0) -value else value
}