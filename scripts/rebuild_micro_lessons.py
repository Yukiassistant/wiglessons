#!/usr/bin/env python3
"""Build the five-minute wig lessons curriculum JSON."""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import quote_plus


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "lessons.json"

SAFETY = (
    "Stop before heat, blades, adhesives, dye, or dust if the setup is not ventilated, "
    "protected, and tested on scrap first."
)

DEFINITIONS = {
    "accuracy": "How closely the wig matches the character reference while still working on a real head.",
    "adhesive": "A bonding product; keep skin-safe adhesives separate from craft glues and styling sprays.",
    "anchor": "The point or structure that carries pull, weight, clips, straps, or supports.",
    "armature": "A hidden support skeleton, often wire, foam, mesh, or plastic, that holds a shape.",
    "backcombing": "Pushing fibers toward the roots to create hidden grip and volume.",
    "base wig": "The starting wig chosen for color, length, cap type, density, and hairline needs.",
    "block": "The head form used for styling, cutting, fitting, and building wig structures.",
    "cap": "The base of the wig that sits on your head and holds the hair or wefts.",
    "cap exposure": "Visible wig cap or weft tracks showing through the hair.",
    "character read": "How quickly the hairstyle is recognizable as the intended character.",
    "clip-on": "A separate hair piece attached with clips or combs instead of built into the base wig.",
    "cool-down": "The period after heat shaping when synthetic fiber locks into its new shape.",
    "coverage": "How well hair, fiber sheets, lace, or panels hide supports, gaps, and construction.",
    "crimping": "Adding fine waves with a crimping iron to create grip, volume, and hidden structure.",
    "density": "How much hair is present in an area; higher density looks fuller but adds weight.",
    "detangling": "Removing knots gently, usually from ends upward, to avoid tightening tangles.",
    "donor wig": "A second wig used for extra fiber, wefts, color sections, or repairs.",
    "ear tab": "The side tab area of a wig near the ear, important for fit and edge blending.",
    "edge": "A visible boundary such as hairline, lace, sideburn, nape, shell rim, or seam.",
    "fiber": "The synthetic hair material the wig is made from.",
    "fiber memory": "Synthetic fiber's tendency to keep the shape it cooled or was stored in.",
    "fiber sheet": "A flat sheet of glued or fused wig fiber used to cover shapes or make stylized pieces.",
    "fit": "How the wig or shell sits on the wearer's head without sliding, squeezing, or rubbing.",
    "foam core": "A lightweight foam support used inside oversized spikes, buns, curls, or shapes.",
    "friction frizz": "Frizz caused by rubbing against clothes, hands, collars, bags, or storage surfaces.",
    "hair direction": "The direction fibers travel so the style, seams, and coverage look intentional.",
    "hairline": "The visible edge where wig hair begins around the forehead, temples, sideburns, or nape.",
    "hard cap": "A rigid or semi-rigid wig base built to hold sculptural shapes.",
    "heat-resistant": "Able to tolerate controlled heat better than standard synthetic fiber, but still meltable.",
    "helmet wig": "A wig built over a rigid or semi-rigid shell, usually for large sculptural hair.",
    "hidden support": "Structure under the visible surface that creates lift, shape, strength, or balance.",
    "hybrid build": "A wig that combines soft styling with hard support, attachments, lace, or props.",
    "lace front": "A wig with sheer lace at the front where individual hairs create a realistic hairline.",
    "layering": "Cutting hair at different lengths to remove bulk, create shape, or add movement.",
    "load path": "The route weight and force take through the wig into anchors and the wearer's head.",
    "mechanical attachment": "A physical attachment method like clips, screws, snaps, straps, buckles, or magnets.",
    "mockup": "A quick test version made before committing to final materials.",
    "negative space": "The empty shapes around hair chunks that help the silhouette read clearly.",
    "open-weft cap": "A cap made with rows of wefts and open spaces for airflow and modification.",
    "part line": "The visible line where hair separates; on wigs it often needs extra planning to look clean.",
    "patch test": "A small skin test for adhesives, removers, or products before full use.",
    "pressure point": "A spot where weight, edge, clip, strap, or shell presses uncomfortably.",
    "reverse weft": "Wefting placed so hair can be pulled up or back without exposing tracks.",
    "rough cut": "The first conservative cut that removes length while leaving room to refine.",
    "sectioning": "Dividing hair into controlled areas before cutting, heating, teasing, or styling.",
    "setting": "Shaping synthetic fiber with heat, steam, tension, clips, or rollers until it cools.",
    "shake test": "A movement test that checks whether a style or attachment survives motion.",
    "shell": "A rigid or semi-rigid base structure that carries a shape, usually hidden under hair.",
    "silhouette": "The outer shape of the hairstyle, usually the first thing viewers recognize.",
    "skin adhesive": "A product meant to bond something to skin and release with the correct remover.",
    "spike": "A pointed or lifted hair shape that may need texture, product, heat, or support.",
    "strand test": "A hidden test on a small fiber section before using heat, dye, or product broadly.",
    "support layer": "The hidden underlayer that creates volume, grip, lift, or structure.",
    "surface layer": "The visible hair layer that hides support work and gives the final finish.",
    "swatch test": "A small color or product test on scrap fiber before changing the whole wig.",
    "teasing": "Backcombing fiber to create volume, texture, and internal grip.",
    "tension": "Controlled pulling force used while cutting, straightening, setting, or anchoring hair.",
    "thinning": "Removing bulk without shortening the whole section, usually with thinning shears or careful cuts.",
    "touch-up kit": "Products and tools packed for quick fixes during wear.",
    "ventilating": "Tying individual hairs into lace or mesh to create hairlines, parts, or repairs.",
    "wear test": "A timed trial wear to check heat, pressure, slipping, visibility, comfort, and failure points.",
    "weft": "A sewn strip of wig hair that can be added, removed, moved, or harvested.",
    "wig map": "A simple plan that labels what each part of the wig must do.",
    "wire support": "Wire used to hold shape, spread load, or connect a piece to anchors.",
}

SPECS = [
    ("Wig Anatomy First Look", "Identify the wig's main parts.", "Before styling, separate the base wig from the hair surface. The cap creates fit and structure; the hairline is the visible front edge that needs clean coverage.", ["base wig", "hairline"], "Look at one wig or photo and point out the cap area and front hairline.", "Which part affects fit, and which part affects what people see first?", "You can identify the base wig and hairline in one example."),
    ("Cap And Weft Basics", "Know what holds the hair in place.", "A cap is the foundation that sits on the head. Wefts are sewn strips of hair attached to that foundation, and their direction affects coverage.", ["cap", "weft"], "Point to where the cap is and where a weft would sit on any wig photo or wig you own.", "Which word describes the base, and which describes a strip of hair?", "You can use cap and weft correctly in one sentence."),
    ("Fiber And Density", "Understand what the hair is and how full it is.", "Synthetic wig hair is fiber. Density is how much fiber is packed into an area, which changes fullness, weight, and cap coverage.", ["fiber", "density"], "Look at one wig image and label it low, medium, or high density from visible fullness.", "Would more density help this wig, or make it heavier than needed?", "You can explain density without touching styling tools."),
    ("Hairline And Lace Front", "Separate visible edge needs from the rest of the wig.", "A visible forehead or pulled-back style needs a planned edge. Lace fronts place individual-looking hairs into sheer lace so the front hairline can show.", ["hairline", "lace front"], "Pick one character and decide whether the front hairline is visible or hidden by bangs.", "Does this character need realism at the edge, or just clean coverage?", "You can choose lace or a hidden hairline for one character."),
    ("Soft, Supported, Or Helmet", "Sort hairstyles by structure before styling.", "Some wigs are mostly hair. Some need hidden support. Some are closer to a helmet covered in hair.", ["hidden support", "helmet wig"], "Sort three character hairstyles into soft, supported, or helmet candidates.", "Which one stops behaving like hair?", "You can choose a broad build category."),
    ("Make A Wig Map", "Label the build zones.", "A wig map labels visible hair, hidden support, hairline, attachments, and problem areas. Each zone gets one job: show, hide, hold, or move.", ["wig map", "coverage"], "Draw a rough outline of one hairstyle and label three zones.", "What part must be hidden for the style to work?", "You have a labeled map with at least three zones."),
    ("Choose One Reference Angle", "Identify the main silhouette.", "The front view usually controls character recognition. Use it to name the largest outside shape before choosing tools or products.", ["character read", "silhouette"], "Find or imagine one front-view reference and name the biggest shape.", "What makes the character recognizable first?", "You can name the main silhouette in one phrase."),
    ("Side View Check", "Notice depth and gravity.", "The side view reveals whether hair falls naturally, sticks out, or needs support. This prevents flat front-only planning.", ["negative space", "load path"], "Look at a side view and mark one part that sticks out or floats.", "Where would gravity pull this shape?", "You can name one likely support problem."),
    ("Back View Check", "Account for the rear view.", "The back can expose wefts, gaps, ponytail anchors, and unfinished support. Mark one rear-view requirement before cutting, sewing, or attaching pieces.", ["cap exposure", "hair direction"], "Write one sentence about what the back of the wig must show or hide.", "What would look unfinished from behind?", "You can state one back-view requirement."),
    ("Task Materials List", "Match tools to the wig task.", "A materials list belongs to a specific wig task: cutting, heat setting, sewing, gluing, transport, or touch-up. Leave unrelated tools out.", ["base wig", "touch-up kit"], "Write three items needed for one basic wig practice session.", "Which item is required before the task can start?", "You have a three-item task list."),
    ("Fit Comes First", "Check fit before surface styling.", "A styled wig that slips, pinches, or sits crooked will still fail in wear. Fit controls placement, comfort, and whether the hairline lands correctly.", ["fit", "pressure point"], "Put on or imagine a wig and name one place it might squeeze, slide, or rub.", "Where would you notice discomfort first?", "You can name one fit risk."),
    ("Block Basics", "Compare the work head to the wearer.", "The block is the head form used for styling and building. A too-small or too-large block can distort the final fit, height, and hairline placement.", ["block", "fit"], "Write whether your work head is smaller, larger, or unknown compared with your head.", "What error could that create?", "You know whether your block needs checking."),
    ("Mark The Front", "Prevent crooked work.", "A front mark, center line, and ear landmarks keep cuts, parts, and attachments aligned to the wearer instead of the stand.", ["hairline", "ear tab"], "On paper or a photo, mark front center and both ear areas.", "What would look wrong if the wig rotated slightly?", "You can identify front center and ear zones."),
    ("Comfort Gap", "Leave room for real wear.", "Rigid or bulky builds need room for hair, pins, padding, and movement. No style is done if it only fits a foam head.", ["pressure point", "helmet wig"], "Name one place a shell or heavy wig needs extra room.", "What would hurt after ten minutes?", "You can name one comfort allowance."),
    ("Quick Wear Test Idea", "Plan a short fit test.", "A wear test checks heat, slipping, pressure, blocked vision, and edge lift before the wig is final.", ["wear test", "fit"], "Write a five-minute wear-test checklist with three things to notice.", "What would make you stop wearing it?", "You have a wear-test checklist."),
    ("Synthetic Fiber Rule", "Learn the heat warning before heat work.", "Heat-resistant fiber can still melt. Always test a hidden strand or scrap before trusting a temperature.", ["heat-resistant", "strand test"], "Write the sentence: test hidden fiber before visible heat.", "What happens if the label is wrong?", "You know the test comes before the tool."),
    ("Cool-Down Rule", "Understand how synthetic fiber sets.", "Synthetic fiber often holds the shape it cools in. Moving it too soon can weaken the set.", ["cool-down", "fiber memory"], "Name one shape that would need to cool while held in place.", "Why is waiting part of the technique?", "You can explain heat, hold, cool."),
    ("Tension Rule", "Use controlled pull, not force.", "Tension helps straightening, setting, and smoothing, but too much pull can stretch, frizz, or deform fiber.", ["tension", "setting"], "Mime or imagine holding a small section straight while it cools.", "Where is the line between controlled and rough?", "You can describe gentle tension."),
    ("Steam As Moist Heat", "Know what steam is for.", "Steam can relax or reshape synthetic fiber with less direct contact than a hot iron, but steam still heats the fiber.", ["setting", "fiber memory"], "Write one job steam might do: relax, smooth, reshape, or reset.", "Which steam job changes the fiber shape?", "You can name one steam use and one caution."),
    ("Heat Log", "Make heat repeatable.", "A heat log records tool, temperature, time, and result so a successful strand test can be repeated on the visible wig.", ["strand test", "heat-resistant"], "Create a four-field heat log template.", "Which field records the exact temperature?", "You have a reusable heat-test note."),
    ("Detangle Ends First", "Avoid making knots worse.", "Detangle from the ends upward. Starting at the roots pushes knots tighter and increases friction frizz.", ["detangling", "friction frizz"], "Write the order: ends, middle, roots.", "What causes frizz besides tangles?", "You know the detangling direction."),
    ("Storage Shape", "Store for the silhouette.", "Storage should protect the shape you built. A loose wig and a spiked wig should not be packed the same way.", ["silhouette", "coverage"], "Name one storage risk for a long wig and one for a styled wig.", "What would get crushed first?", "You can choose storage based on shape."),
    ("Basic Repair Kit", "Pack for likely wig failures.", "A repair kit should match the wig's failure points: loose clips, lifted edges, flyaways, broken supports, or rubbed color.", ["touch-up kit", "wear test"], "List three repair items for a styled wig.", "Which failure is most likely?", "You have a repair-kit draft."),
    ("Cleaning Caution", "Know when not to wash aggressively.", "Lace, product, glued pieces, and structured shapes can be damaged by rough cleaning. Match cleaning pressure to the most delicate part of the wig.", ["edge", "coverage"], "Name one part of a styled wig you would clean gently.", "What could loosen or frizz?", "You can name one cleaning risk."),
    ("Maintenance Habit", "End sessions with a reset.", "An end-of-session reset removes loose pins, records damage, protects the silhouette, and stores the wig away from friction.", ["touch-up kit", "wear test"], "Write a two-step shutdown routine for wig practice.", "Which step protects the finished shape?", "You have a shutdown routine."),
    ("Cutting Is Permanent", "Start conservative.", "Synthetic wig cutting is unforgiving. Leave extra length, test the fall, then refine.", ["rough cut", "sectioning"], "Choose a pretend bang length, then write a safer longer first cut.", "Where would overcutting hurt most?", "You know the first cut should leave room."),
    ("Section Before Cutting", "Control what you cut.", "Sectioning isolates the hair being cut from display layers, support layers, and hair that still needs length for blending.", ["sectioning", "surface layer"], "Describe one section you would clip away before trimming bangs.", "What hair should not be cut yet?", "You can name one protected section."),
    ("Face Frame", "Identify front pieces.", "Face-framing pieces define the visible outline beside the cheeks, jaw, and forehead. Their length and angle change the character read.", ["hairline", "silhouette"], "Look at one character and name the left and right face-frame shapes.", "Are they symmetrical?", "You can identify the face-frame pieces."),
    ("Point Cutting Idea", "Soften blunt edges.", "Point cutting removes small notches from the end so a cut line looks less blocky. It still needs restraint.", ["rough cut", "thinning"], "Write when you might want a soft edge instead of a blunt edge.", "Which characters need graphic bluntness?", "You know point cutting changes the edge feel."),
    ("Check On The Head", "Compare stand fit to worn fit.", "Hair falls differently on a block than on a real head. Fit, height, and face shape can change the cut.", ["block", "fit"], "Write one thing you would check while wearing the wig before final cutting.", "What changes between block and head?", "You can name one on-head check."),
    ("Layering Purpose", "Use layers for shape, not random thinning.", "Layering can remove bulk, create movement, or shape anime chunks. Each cut should have a job.", ["layering", "silhouette"], "Choose one reason to layer a wig: movement, volume control, or shape.", "What happens if you layer without a goal?", "You can state the purpose before cutting."),
    ("Thinning Risk", "Avoid exposing the cap.", "Thinning removes bulk, but too much near the roots can reveal tracks or cap. Work gradually.", ["thinning", "cap exposure"], "Name one area where thinning would be risky.", "Where is the cap easiest to expose?", "You can identify a thinning danger zone."),
    ("Razor Texture Concept", "Identify piecey texture.", "Razor texture creates feathered or separated ends. Use it for piecey shapes; avoid it when the reference needs a blunt graphic edge.", ["surface layer", "silhouette"], "Name one style that wants piecey texture.", "Would this texture match realism or stylization?", "You can identify one use for razor texture."),
    ("Before And After Photos", "Document cutting choices.", "Before-and-after photos reveal changes in length, silhouette, symmetry, and density that are hard to judge while the wig is on the stand.", ["accuracy", "silhouette"], "Plan two photo angles before a cut: front and side.", "Which angle shows the cut line most clearly?", "You have a two-angle photo plan."),
    ("Stop Point", "Know when not to keep cutting.", "Many wig problems get worse when you chase perfection while tired. Define a stop point first.", ["rough cut", "accuracy"], "Write one sentence that tells you when to stop cutting for the day.", "What is the sign you are overworking it?", "You have a stop rule."),
    ("Crimping Creates Grip", "Use hidden texture for lift.", "Crimping adds fine waves that create grip and volume underneath a smoother surface layer.", ["crimping", "support layer"], "Point to where crimping would hide under a visible layer.", "Why not crimp the whole outside?", "You can place crimping in a hidden layer."),
    ("Teasing Vs Backcombing", "Connect two common words.", "Teasing and backcombing are closely related: both push fibers toward roots to create grip and volume.", ["teasing", "backcombing"], "Write one place you would tease and one place you would keep smooth.", "What should stay visible and clean?", "You can separate support texture from surface finish."),
    ("Surface Layer", "Keep the outside intentional.", "The surface layer hides support work. It should look like the chosen character style, not the construction underneath.", ["surface layer", "coverage"], "Name one visible section that should stay smoother than the underlayer.", "What construction might show through?", "You can identify a display layer."),
    ("Small Volume Test", "Compare lift methods.", "Volume can come from crimping, teasing, added wefts, or support. Material-heavy methods add weight and can change the cap fit.", ["hidden support", "density"], "Rank crimping, teasing, and extra wefts from least to most material-heavy.", "Which method changes weight the most?", "You can choose a low-commitment lift method."),
    ("Frizz Boundary", "Separate volume from surface mess.", "Support texture belongs under the surface layer. Visible outer fibers need cleaner direction, lower friction, and controlled product.", ["friction frizz", "surface layer"], "Write one way to protect the visible layer while building volume below.", "Where does support texture become visible mess?", "You can name one anti-frizz habit."),
    ("Product Is Not Structure", "Separate surface hold from weight support.", "Spray and paste can finish a shape, but weight-bearing pieces need support, anchors, stitches, clips, or hardware.", ["adhesive", "load path"], "Name one job for hairspray and one job it should not do.", "Which part carries weight?", "You can separate finish from support."),
    ("Freeze Hold Concept", "Identify stiff surface hold.", "Strong spray locks small spikes, flyaways, and surface direction. It becomes brittle when used as structural support.", ["spike", "surface layer"], "Choose one small surface detail that spray could control.", "What would break if it flexed?", "You can name a cosmetic hold job."),
    ("Glue Categories", "Match adhesive type to the surface.", "Craft glue, skin adhesive, and styling product solve different problems. The wrong adhesive can damage skin or fail structurally.", ["adhesive", "skin adhesive"], "Sort these into skin or not-skin: spirit gum, hot glue, hairspray.", "Which one needs a remover?", "You can separate skin adhesives from craft products."),
    ("Patch Test", "Protect skin before adhesives.", "Anything that touches skin for wear should be patch tested when possible, especially adhesives and removers.", ["patch test", "skin adhesive"], "Write where and when you would patch test an adhesive.", "What would make you avoid using it?", "You can explain the patch-test purpose."),
    ("Cleanup Plan", "Plan removal before application.", "Adhesive work is not planned until removal is planned. The correct remover is part of the tool list.", ["skin adhesive", "patch test"], "Write one adhesive and the matching remover you would verify before use.", "What happens if removal is improvised?", "You know remover planning is mandatory."),
    ("Anime Hair Forms", "Translate drawings into buildable shapes.", "Drawn hair can be reduced into major chunks: bangs, side pieces, crown volume, spikes, ponytails, buns, and loose ends.", ["silhouette", "character read"], "Name the three biggest chunks in one character hairstyle.", "Which chunk matters most for recognition?", "You can reduce a style to major forms."),
    ("Chunk Hierarchy", "Rank pieces by visual importance.", "Primary chunks control the silhouette. Secondary chunks support the style, and detail chunks can be simplified if they do not change the character read.", ["character read", "negative space"], "Rank three hair chunks as primary, secondary, or detail.", "Which piece could be simplified?", "You can prioritize chunks."),
    ("Negative Space", "Use empty shapes as reference.", "The spaces between hair chunks are often as recognizable as the chunks themselves.", ["negative space", "silhouette"], "Find one empty shape around a character's hair and describe it.", "Would filling that gap ruin the read?", "You can notice negative space."),
    ("Soft Spike", "Identify spikes that can stay flexible.", "Short spikes may only need cutting, heat direction, texture, and product. Longer spikes usually need hidden support.", ["spike", "setting"], "Choose whether one spike is short enough to stay soft.", "What would make it need support?", "You can classify a short spike."),
    ("Supported Spike", "Know when hair needs help.", "Longer or heavier spikes need a support plan before surface styling. More spray is not the plan.", ["wire support", "foam core"], "Pick wire or foam for a pretend long spike and say why.", "Which support is lighter or safer here?", "You can choose a support type."),
    ("Shake Test", "Test movement early.", "A shake test reveals whether a spike, ponytail, or attachment is actually secure before final finishing.", ["shake test", "anchor"], "Write what you would watch during a gentle shake test.", "What failure would be acceptable in a mockup?", "You can define a movement test."),
    ("Wefts Add More Than Hair", "Understand weft jobs.", "Wefts can add density, color, coverage, repair material, and direction control. They also add weight.", ["weft", "density"], "Name one reason to add a weft besides making hair fuller.", "What problem could added weight create?", "You can name two weft jobs."),
    ("Donor Wig Concept", "Use extra hair deliberately.", "A donor wig provides matching or contrasting fiber for wefts, repairs, hairlines, or covering supports.", ["donor wig", "coverage"], "Name one part of a build that could use donor wig fiber.", "Does the fiber need to match exactly?", "You can name one donor-wig use."),
    ("Weft Direction", "Think before sewing.", "The direction a weft points affects how hair falls and what it covers. Placement is a design decision.", ["hair direction", "coverage"], "Draw one arrow showing how an added weft should fall.", "What would look wrong if it pointed the other way?", "You can plan weft direction."),
    ("Reverse Weft Idea", "Understand lifted hair bases.", "Reverse wefts help hair pull up or back without exposing tracks, especially for ponytails and updos.", ["reverse weft", "cap exposure"], "Name one style that might need reverse wefting.", "Where would tracks show?", "You can identify a reverse-weft use case."),
    ("Short Weft Sew Plan", "Define a small weft attachment.", "Even a short weft addition needs a start point, end point, direction, and knot/security plan.", ["anchor", "weft"], "Write a one-line sew plan for a short hidden weft.", "Where should the thread start and stop?", "You can describe a short sew plan."),
    ("Ponytail Weight", "Account for pull.", "Ponytails and pigtails pull on the cap. The higher or heavier they are, the more anchoring matters.", ["anchor", "load path"], "Name where a ponytail's weight pulls on the wig.", "What would stop it sliding back?", "You can identify the pull direction."),
    ("Clip-On Choice", "Know when separate pieces help.", "Clip-ons can reduce base-wig complexity, but they still need blending, balance, and secure placement.", ["clip-on", "coverage"], "Pick one style where a clip-on would be easier than building in the ponytail.", "What edge must be hidden?", "You can decide if clip-on helps."),
    ("Braid Bulk", "Plan for volume.", "Braids need more fiber than loose hair to look full. A thin braid can make a dense wig look strangely small.", ["density", "weft"], "Estimate whether one character braid needs extra fiber.", "Would a donor wig help?", "You can spot braid-density needs."),
    ("Updo Exposure", "Pulled-back styles reveal construction.", "Any updo can reveal cap edges, tracks, lace, or sparse zones. Plan coverage before pulling hair back.", ["cap exposure", "hairline"], "Name one area an updo might expose.", "How could you hide it?", "You can name an updo exposure risk."),
    ("Anchor Backup", "Spread load across more than one anchor.", "Heavy attachments are safer when weight is spread or backed up. Single points fail more easily.", ["anchor", "mechanical attachment"], "Name one backup for a heavy ponytail or bun.", "Which backup keeps the attachment from rotating?", "You can name a backup anchor idea."),
    ("Visible Edge Decision", "Choose realism or stylization.", "A visible edge can be natural lace, stylized points, or hidden under hair depending on the character reference.", ["edge", "hairline"], "Choose one character edge and label it realistic, stylized, or hidden.", "What does the viewer actually see?", "You can classify an edge."),
    ("Ventilating Use Case", "Know what ventilating is for.", "Ventilating ties individual hairs into lace or mesh. It is best used for visible edges, part lines, sideburns, napes, and small repairs.", ["ventilating", "lace front"], "Name one place ventilating would be worth the time.", "Which visible edge would benefit most?", "You can name one high-value ventilating use."),
    ("Density Gradient", "Make edges less pluggy.", "A natural-looking hairline usually gets denser gradually. A sudden wall of hair can look fake.", ["density", "hairline"], "Describe sparse-to-dense in one sentence.", "Where should the edge be lighter?", "You can explain hairline density gradient."),
    ("False Hairline Idea", "Know a stylized shortcut.", "A false hairline can use glued fibers, lace pieces, or styling to fake an edge without a full lace-front build.", ["edge", "adhesive"], "Name one style where a false hairline might be enough.", "What makes it acceptable from viewing distance?", "You can describe a false-edge option."),
    ("Sideburns And Nape", "Edges are not only the forehead.", "Temples, sideburns, and nape can expose wig construction when hair is short or pulled up.", ["ear tab", "edge"], "Pick one non-forehead edge to check on a character.", "Would movement reveal it?", "You can name one side or back edge risk."),
    ("Hairline Decision Card", "Make one edge plan.", "A hairline decision card names the method: hide it, lace it, ventilate it, glue fibers, or stylize it.", ["wig map", "hairline"], "Write one hairline method for one character.", "Which reference detail supports that method?", "You can choose a hairline method."),
    ("Color Reality Check", "Synthetic color has limits.", "Synthetic wigs usually cannot be lightened like human hair. Darkening, tinting, adding wefts, or buying a closer base are different risk levels.", ["swatch test", "fiber"], "Write whether one color change is darker, lighter, or same-level.", "Which option changes the original wig the least?", "You can identify risky color changes."),
    ("Swatch First", "Test color before the whole wig.", "A swatch test catches dye results, rub-off, texture change, and heat damage before the final wig is involved.", ["swatch test", "strand test"], "List three things a color swatch should check.", "What would make the swatch fail?", "You can design a color swatch test."),
    ("Root Shadow", "Use color for depth.", "A darker root can add depth or match a character without recoloring the entire wig.", ["hair direction", "coverage"], "Name one character or style where darker roots would help.", "Would it improve realism or accuracy?", "You can identify a root-shadow use."),
    ("Rub-Off Risk", "Consider skin and costume transfer.", "Sprays, markers, and dyes can transfer to skin, collars, props, or hands. Test contact, not just color.", ["swatch test", "friction frizz"], "Name one surface the wig might rub against.", "What would be ruined by color transfer?", "You can name one rub-off risk."),
    ("Buy Vs Modify", "Choose the lower-risk color path.", "Sometimes the best color technique is buying a closer wig or adding a colored weft, not dyeing.", ["donor wig", "weft"], "Choose buy, add weft, or color-test for one pretend color problem.", "Which option risks the final wig least?", "You can choose a safer color path."),
    ("Hard Cap Purpose", "Understand rigid bases.", "A hard cap carries shapes that hair alone cannot hold. It must fit, breathe, and avoid sharp edges.", ["hard cap", "shell"], "Name one hairstyle that might justify a hard cap.", "What comfort issue would you check first?", "You can explain why a shell might exist."),
    ("Shell Mockup", "Test shape cheaply.", "A paper, tape, or scrap foam mockup can check size and shape before final materials.", ["mockup", "shell"], "Describe a mini mockup for one large hair shape.", "What question would the mockup answer?", "You can name one mockup goal."),
    ("Armature Choice", "Pick a hidden skeleton only when needed.", "An armature can hold shape, but it also adds complexity, weight, and safety concerns.", ["armature", "load path"], "Choose whether a floating ahoge needs no support, wire, or foam.", "What carries the load?", "You can choose or reject armature support."),
    ("Foam Core Coverage", "Hide lightweight bulk.", "Foam can make large shapes lighter than solid hair, but it must be covered convincingly.", ["foam core", "coverage"], "Name how you would cover one foam shape: wefts, fiber sheet, or surface hair.", "Where might foam show?", "You can pair foam with a coverage method."),
    ("Wire Safety", "Use wire carefully.", "Wire can support shapes, but ends and pressure points must be protected from the wearer and the wig fiber.", ["wire support", "pressure point"], "Write one safety rule for wire inside a wig.", "Where could wire poke or bend badly?", "You can name one wire safety risk."),
    ("Mechanical Attachments", "Use hardware when glue is not enough.", "Large headpieces often need clips, screws, snaps, straps, magnets, or other mechanical support.", ["mechanical attachment", "anchor"], "Pick one attachment method for horns, crown, or detachable hair mass.", "Why is glue alone weak here?", "You can choose one mechanical method."),
    ("Detachable Sections", "Plan removable hair pieces.", "A detachable section needs a secure connection, hidden join, repeatable placement mark, and packing plan.", ["mechanical attachment", "coverage"], "Name one hair piece that should detach for packing.", "How would you hide the join?", "You can name one detachable build option."),
    ("Ventilation Gap", "Do not trap heat blindly.", "Rigid or dense builds need some comfort planning. Airflow and heat buildup matter before final finish.", ["wear test", "helmet wig"], "Name one place airflow could exist without ruining the look.", "What would make the wig too hot?", "You can name one ventilation idea."),
    ("Removal Method", "Plan how the wig comes off.", "If a wig uses adhesive, hardware, or a shell, the wearer needs a safe release order and reachable release points.", ["skin adhesive", "mechanical attachment"], "Write one removal step for a complex wig.", "Which release point must be reachable first?", "You can name a safe removal step."),
    ("Transport Shape", "Pack for the build type.", "A helmet wig, spike wig, and loose wig need different protection. Packing is part of the design.", ["helmet wig", "touch-up kit"], "Choose box, stand, bag, or custom support for one style.", "What would break in transit?", "You can choose transport based on shape."),
    ("Milestone: Soft Wig Plan", "Plan a wearable soft wig.", "A soft wig project can use a base wig, conservative cut, light shaping, and a clear stop point.", ["base wig", "rough cut"], "Write a three-step plan for a short or medium soft wig.", "Which step changes the wig permanently?", "You have a soft-wig plan."),
    ("Milestone: Support Sample", "Plan one structural test.", "Before a huge build, prove one support idea in miniature: spike, bun, ahoge, ponytail, or horn integration.", ["mockup", "shake test"], "Pick one support sample and write what it must prove.", "What failure would teach you the most?", "You have one structural sample idea."),
    ("Milestone: Edge Sample", "Plan one visible edge test.", "A hairline or sideburn test is smaller than a full wig and reveals whether the method looks acceptable.", ["edge", "ventilating"], "Choose one edge sample: lace, false hairline, sideburn, or nape.", "What viewing distance matters?", "You have one edge sample idea."),
    ("Photo Checklist", "Capture useful proof.", "Good photos show front, side, back, three-quarter, edge, and any interior support so fit, silhouette, and coverage can be checked separately.", ["accuracy", "coverage"], "Write three photos you would take of a finished wig.", "Which photo checks coverage?", "You have a three-shot checklist."),
    ("Critique With Causes", "Name the technical reason.", "Useful critique says why something looks wrong: fit, density, edge, silhouette, color, coverage, or support.", ["fit", "accuracy"], "Pick one possible flaw and name its likely cause.", "Is the problem visual, structural, or comfort-related?", "You can critique by cause."),
    ("Next Skill Target", "Choose one weak skill.", "The best next practice target is specific: cutting, heat tests, edge work, wefting, coverage, or support building.", ["strand test", "swatch test"], "Choose one skill to practice on scraps before using an expensive wig.", "Why that skill first?", "You have one next practice target."),
    ("Personal Workflow", "Turn wig work into a repeatable order.", "A repeatable workflow orders reference, fit, tests, structure, surface styling, wear test, touch-up kit, and storage.", ["wig map", "wear test"], "Write a five-step personal wig workflow from reference to storage.", "Which step checks fit before styling?", "You have a short repeatable workflow."),
    ("Build Review", "Review the wig by technical category.", "A useful review checks fit, comfort, accuracy, coverage, color, edges, support, and transport as separate categories.", ["accuracy", "wear test"], "Pick one finished or planned wig and name the next technical improvement.", "Which category would improve the build most?", "You have one practical next target."),
]


BANNED_LESSON_PHRASES = (
    "this course is now",
    "micro-lesson",
    "micro lesson",
    "a few shared words",
    "later lessons",
    "today only",
    "less confusing",
    "large tutorial",
    "outside reading",
    "resource note",
    "web app",
    "tracker",
    "avoid drowning",
    "people forget",
    "shopping spiral",
    "prevent friction",
    "less guessy",
    "not automatically",
    "forget later",
    "tiny",
    "staring at the wig",
    "do not solve",
    "do not use one glue",
    "graphic design",
    "not every piece deserves",
    "not guessed",
    "do not trust",
    "overkill",
    "simple hiding",
    "lace front by default",
    "make transport",
    "panic or force",
    "manageable",
    "biggest lie",
    "fun step",
    "tempted to skip",
    "vague feeling",
)

BANNED_GLOSSARY_TERMS = {
    "glossary",
    "readiness",
    "reflection",
    "resource note",
}


TUTORIAL_HUBS = {
    "arda_master": {
        "title": "Tutorial hub: Arda Wigs master list",
        "url": "https://arda-wigs.com/blogs/tutorials/tutorial-master-list",
    },
    "arda_structural": {
        "title": "Tutorial hub: Arda Wigs structural builds",
        "url": "https://arda-wigs.com/blogs/tutorials/tagged/iron-wig",
    },
    "epic_beginner": {
        "title": "Beginner guide: Epic Cosplay Wigs",
        "url": "https://www.epiccosplay.com/pages/wigs",
    },
    "epic_tips": {
        "title": "Tutorial hub: Epic Cosplay tips and tricks",
        "url": "https://www.epiccosplay.com/pages/tips-and-tricks",
    },
}


def tutorial_hub_for(title: str, terms: list[str]) -> dict[str, str]:
    text = " ".join([title, *terms]).lower()
    if any(word in text for word in ("hard cap", "shell", "helmet", "armature", "foam", "wire", "mechanical", "detachable")):
        return TUTORIAL_HUBS["arda_structural"]
    if any(word in text for word in ("heat", "cool", "steam", "strand", "swatch", "color", "cut", "layer", "thin", "razor", "crimp", "teas", "frizz", "dye")):
        return TUTORIAL_HUBS["epic_tips"]
    if any(word in text for word in ("hairline", "lace", "ventilat", "edge", "weft", "pony", "braid", "updo", "bun", "clip", "donor")):
        return TUTORIAL_HUBS["arda_master"]
    return TUTORIAL_HUBS["epic_beginner"]


def reference_resources(title: str, terms: list[str]) -> list[dict[str, str]]:
    search_text = " ".join(["cosplay wig", title, *terms])
    image_query = quote_plus(f"{search_text} reference images")
    website_query = quote_plus(f"{search_text} tutorial guide")
    return [
        {
            "title": f"Reference images: {title}",
            "url": f"https://duckduckgo.com/?q={image_query}&iax=images&ia=images",
        },
        tutorial_hub_for(title, terms),
        {
            "title": f"Website search: {title}",
            "url": f"https://duckduckgo.com/?q={website_query}",
        },
    ]


def lesson(day: int, spec: tuple[str, str, str, list[str], str, str, str]) -> dict:
    title, objective, concept, terms, practice, reflection, readiness = spec
    return {
        "day": day,
        "title": title,
        "estimatedMinutes": 5,
        "objective": objective,
        "concept": concept,
        "glossary": [{"term": term, "definition": DEFINITIONS[term]} for term in terms],
        "requiredResources": reference_resources(title, terms),
        "optionalResources": [],
        "practice": practice,
        "safety": SAFETY,
        "reflection": reflection,
        "readiness": readiness,
    }


def collect_strings(value) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        strings = []
        for item in value:
            strings.extend(collect_strings(item))
        return strings
    if isinstance(value, dict):
        strings = []
        for item in value.values():
            strings.extend(collect_strings(item))
        return strings
    return []


def validate_lessons(data: dict) -> None:
    problems: list[str] = []
    for item in data["lessons"]:
        day = item["day"]
        if item.get("estimatedMinutes") != 5:
            problems.append(f"Day {day}: expected estimatedMinutes=5")
        if len(item.get("requiredResources", [])) < 3:
            problems.append(f"Day {day}: missing required references")
        for entry in item.get("glossary", []):
            term = entry["term"].lower()
            if term in BANNED_GLOSSARY_TERMS:
                problems.append(f"Day {day}: meta glossary term {entry['term']!r}")
        lesson_text = " ".join(
            collect_strings(
                {
                    "title": item["title"],
                    "objective": item["objective"],
                    "concept": item["concept"],
                    "glossary": item["glossary"],
                    "practice": item["practice"],
                    "reflection": item["reflection"],
                    "readiness": item["readiness"],
                }
            )
        ).lower()
        for phrase in BANNED_LESSON_PHRASES:
            if phrase in lesson_text:
                problems.append(f"Day {day}: banned lesson phrase {phrase!r}")
    if problems:
        raise ValueError("\n".join(problems))


def main() -> int:
    data = {
        "course": {
            "title": "Cosplay Wig Styling",
            "startDate": "2026-07-02",
            "timezone": "America/Los_Angeles",
            "estimatedMinutes": 5,
            "description": "A self-contained 90-day cosplay wig styling course with short daily lessons.",
        },
        "lessons": [lesson(index, spec) for index, spec in enumerate(SPECS, start=1)],
    }
    validate_lessons(data)
    OUT.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(SPECS)} lessons to {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
